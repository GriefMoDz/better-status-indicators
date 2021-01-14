/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Open Software License (OSL 3.0)
 * that is bundled with this plugin in the file LICENSE.md.
 * It is also available through the world-wide-web at this URL:
 * https://opensource.org/licenses/OSL-3.0
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade the plugin to
 * newer versions in the future. If you wish to customize the plugin for
 * your needs please document your changes and make backups before you update.
 *
 *
 * @copyright Copyright (c) 2020-2021 GriefMoDz
 * @license   OSL-3.0 (Open Software License ("OSL") v. 3.0)
 * @link      https://github.com/GriefMoDz/better-status-indicators
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/* eslint-disable object-property-newline */
const { React, Flux, FluxDispatcher, getModule, i18n: { Messages } } = require('powercord/webpack');
const { inject, uninject } = require('powercord/injector');
const { findInReactTree } = require('powercord/util');

module.exports = {
  name: 'Status Everywhere',
  description: 'Displays user statuses in places where Discord usually doesn\'t even bother.',
  icon: 'Status',
  settings: {
    'se-typingStatus': {
      type: 'radio',
      name: 'Typing Status Display',
      description: Messages.BSI_STATUS_EVERYWHERE_TYPING_STATUS_DESC.format({}),
      defaultValue: 'hidden',
      options: [ {
        name: 'Show for self and others',
        value: 'self+others'
      }, {
        name: 'Show for others',
        value: 'others'
      }, {
        name: 'Hidden',
        value: 'hidden'
      } ]
    },
    'se-mobileStatus': {
      type: 'radio',
      name: 'Mobile Status Display',
      description: 'Set whether or not the mobile status indicator should be displayed, and for who.',
      defaultValue: 'others',
      options: [ {
        name: 'Show for self and others',
        value: 'self+others'
      }, {
        name: 'Show for others',
        value: 'others'
      }, {
        name: 'Hidden',
        value: 'hidden'
      } ]
    },
    'se-reducedStatuses': {
      type: 'switch',
      name: 'Reduced Statuses',
      description: 'Scales down status indicators in chat for those that find them too obtrusive.',
      defaultValue: false
    }
  },

  get currentUserId () {
    return window.DiscordNative.crashReporter.getMetadata().user_id;
  },

  async startModule () {
    const { getSetting } = powercord.api.settings._fluxProps('better-status-indicators');

    FluxDispatcher.subscribe('GUILD_MEMBERS_REQUEST', this.handleMissingStatuses);

    const avatarModule = await getModule([ 'AnimatedAvatar' ]);
    const statusStore = await getModule([ 'isMobileOnline' ]);
    const userStore = await getModule([ 'getCurrentUser' ]);

    const Avatar = avatarModule.default;
    inject('bsi-module-status-everywhere-avatar', avatarModule, 'default', ([ props ], res) => {
      if (props.status || props.size === 'SIZE_16' || props.size === 'SIZE_100') {
        return res;
      }

      const userId = props.userId || props.src.split('/')[4];
      const user = userStore.getUser(userId);
      if (!user || (user && user.isNonUserBot())) {
        return res;
      }

      const getMobileStatusState = () => {
        const mobileStatus = getSetting('se-mobileStatus', 'others');

        return mobileStatus === 'self+others' ? true : mobileStatus === 'others' ? userId !== this.currentUserId : false;
      };

      const { size } = props;
      const ConnectedAvatar = Flux.connectStores([ statusStore, powercord.api.settings.store ], () => ({
        status: statusStore.getStatus(userId),
        isMobile: getMobileStatusState() && statusStore.isMobileOnline(userId)
      }))(Avatar);

      return React.createElement(ConnectedAvatar, {
        ...props,
        statusTooltip: size.split('_').pop() >= 40,
        size
      });
    });

    const typingStore = await getModule([ 'isTyping' ]);
    const MessageHeader = await getModule([ 'MessageTimestamp' ]);
    inject('bsi-module-status-everywhere-chat-avatar', MessageHeader, 'default', ([ props ], res) => {
      const { message } = props;
      const defaultProps = {
        userId: message.author.id,
        size: Avatar.Sizes.SIZE_40
      };

      const getTypingStatusState = () => {
        const typingStatus = getSetting('se-typingStatus', 'others');

        return typingStatus === 'self+others' ? true : typingStatus === 'others' ? defaultProps.userId !== this.currentUserId : false;
      };

      const ConnectedAvatar = Flux.connectStores([ typingStore, powercord.api.settings.store ], () => ({
        isTyping: getTypingStatusState() && typingStore.isTyping(message.channel_id, defaultProps.userId)
      }))(Avatar);

      const AvatarWithPopout = findInReactTree(res, n => n.type?.displayName === 'Popout');
      if (AvatarWithPopout) {
        AvatarWithPopout.props.children = (oldMethod => (args) => {
          let res = oldMethod(args);
          if (res.type !== 'img' || !props.message) {
            return res;
          }

          const originalProps = res.props;
          res = React.createElement('span', {}, React.createElement(ConnectedAvatar, {
            ...originalProps,
            ...defaultProps,
            className: [ originalProps.className, getSetting('se-reducedStatuses', false) && 'bsi-reduced-statuses' ].filter(Boolean).join(' ')
          }));

          return res;
        })(AvatarWithPopout.props.children);
      }

      return res;
    });
  },

  moduleWillUnload () {
    FluxDispatcher.unsubscribe('GUILD_MEMBERS_REQUEST', this.handleMissingStatuses);

    uninject('bsi-module-status-everywhere-avatar');
    uninject('bsi-module-status-everywhere-chat-avatar');
  },

  handleMissingStatuses (data) {
    if (data.userIds) {
      FluxDispatcher.dirtyDispatch({
        type: 'GUILD_SUBSCRIPTIONS_MEMBERS_ADD',
        guildId: data.guildIds[0],
        userIds: data.userIds
      });
    }
  }
};
