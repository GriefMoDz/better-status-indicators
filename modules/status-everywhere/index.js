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

const { React, Flux, getModule, getModuleByDisplayName, i18n: { Messages } } = require('powercord/webpack');
const { findInReactTree } = require('powercord/util');
const { uninject } = require('powercord/injector');
const { Module } = require('../../lib/entities');

module.exports = class StatusEverywhere extends Module {
  get manifest () {
    return {
      name: 'Status Everywhere',
      description: 'Displays user statuses in places where Discord usually doesn\'t even bother to.',
      icon: 'Status',
      settings: {
        'se-typingStatus': {
          type: 'radio',
          name: 'Typing Status Display',
          description: Messages.BSI_STATUS_EVERYWHERE_TYPING_STATUS_DESC?.format?.({}),
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
      }
    };
  }

  startModule () {
    const { getSetting } = powercord.api.settings._fluxProps('better-status-indicators');

    const avatarModule = getModule([ 'AnimatedAvatar' ], false);
    const statusStore = getModule([ 'isMobileOnline' ], false);
    const userStore = getModule([ 'initialize', 'getCurrentUser' ], false);
    const guildStore = getModule([ 'getLastSelectedGuildId' ], false);
    const activityStore = getModule([ 'isGameActivity' ], false);

    const useSubscribeGuildMembers = getModule([ 'useSubscribeGuildMembers' ], false).default;

    const Avatar = this.main.hardwareAccelerationIsEnabled ? avatarModule.AnimatedAvatar : avatarModule.default;
    const proposedAvatarModule = this.main.hardwareAccelerationIsEnabled ? avatarModule.AnimatedAvatar : avatarModule;
    const proposedAvatarMethod = this.main.hardwareAccelerationIsEnabled ? 'type' : 'default';

    this.inject('bsi-module-status-everywhere-avatar', proposedAvatarModule, proposedAvatarMethod, ([ props ], res) => {
      const userId = props.userId || props.src?.includes('/avatars') && props.src.match(/\/(?:avatars|users)\/(\d+)/)[1];

      if (props.status || props.size === 'SIZE_16' || props.size === 'SIZE_20' || props.size === 'SIZE_56' || props.size === 'SIZE_100') {
        return res;
      }

      const user = userStore.getUser(userId);
      if (!user || (user && user.isNonUserBot())) {
        return res;
      }

      const { size } = props;

      const getStatusStates = () => {
        const mobileStatus = getSetting('se-mobileStatus', 'others');
        const typingStatus = getSetting('se-typingStatus', 'hidden');

        return {
          mobileStatus: Boolean(mobileStatus === 'self+others' ? true : mobileStatus === 'others' ? userId !== this.main.currentUserId : false)
            && statusStore.isMobileOnline(userId),
          typingStatus: Boolean(typingStatus === 'self+others' ? true : typingStatus === 'others' ? userId !== this.main.currentUserId : false)
            && typingStore.isTyping(props.message?.channel_id, userId)
        }
      };

      const ConnectedAvatar = Flux.connectStores([ statusStore, typingStore, powercord.api.settings.store ], () => ({
        status: activityStore.isStreaming(props.activities || statusStore.getActivities(userId))
          ? 'streaming'
          : statusStore.getStatus(userId),
        isMobile: getStatusStates().mobileStatus,
        isTyping: getStatusStates().typingStatus
      }))(useSubscribeGuildMembers(() => {
        const members = {};
        const guildId = guildStore.getGuildId();

        return guildId ? (members[guildId] = [ userId ], members) : {};
      })(Avatar));

      return React.createElement(ConnectedAvatar, {
        ...props,
        statusTooltip: size.split('_').pop() >= 32,
        size
      });
    });

    const { default: GuildMemberSubscriptions } = getModule(m => m.default?.prototype?.checkForLeaks, false);
    this.inject('bsi-module-status-everywhere-silence-leaks', GuildMemberSubscriptions.prototype, 'checkForLeaks', () => false, true);

    const MemberListItem = getModuleByDisplayName('MemberListItem', false) || getModule([ 'AVATAR_DECORATION_PADDING' ], false)?.default;
    const MemberListItemTarget = {
      module: MemberListItem.prototype || MemberListItem,
      method: MemberListItem.prototype ? 'renderAvatar' : 'type'
    };

    const _this = this;

    this.inject('bsi-module-status-everywhere-members-list-1', MemberListItemTarget.module, MemberListItemTarget.method, function (_, res) {
      if (res?.props?.children) {
        const AvatarComponent = findInReactTree(res, n => n.props?.hasOwnProperty('isMobile'));
        if (AvatarComponent) {
          AvatarComponent.props.userId = this.props.user.id;
        }
      } else {
        const MemberListItem = res.type;
        _this.inject('bsi-module-status-everywhere-members-list-2', MemberListItem.prototype, 'renderAvatar', function (_, res) {
          const AvatarComponent = findInReactTree(res, n => n.props?.hasOwnProperty('isMobile'));
          if (AvatarComponent) {
            AvatarComponent.props.userId = this.props.user.id;
          }

          return res;
        });

        uninject('bsi-module-status-everywhere-members-list-1');
      }

      return res;
    });

    const typingStore = getModule([ 'isTyping' ], false);
    const MessageHeader = getModule(m => {
      const defaultMethod = m.__powercordOriginal_default ?? m.default;
      return (typeof defaultMethod === 'function' ? defaultMethod : null)?.toString().includes('showTimestampOnHover');
    }, false);

    this.inject('bsi-module-status-everywhere-chat-avatar', MessageHeader, 'default', ([ props ], res) => {
      if (props.compact) {
        return res;
      }

      const { message } = props;
      const defaultProps = {
        userId: message.author.id,
        size: avatarModule.Sizes.SIZE_40
      };

      if (!message.author || message.author.isNonUserBot()) {
        return res;
      }

      const AvatarWithPopout = findInReactTree(res.props?.avatar, n => n.type?.displayName === 'Popout');
      if (AvatarWithPopout) {
        const oldMethod = AvatarWithPopout.props.children;

        AvatarWithPopout.props.children = (args) => {
          let res = oldMethod(args);

          const AvatarImg = res?.props?.children?.[0] || res?.type === 'img' && res;
          if (!AvatarImg || !props.message) {
            return res;
          }

          const newProps = Object.assign(AvatarImg.props, defaultProps);
          const AvatarComponent = React.createElement(avatarModule.AnimatedAvatar, {
            ...newProps,
            message: props.message,
            className: [ newProps.className, getSetting('se-reducedStatuses', false) && 'bsi-reduced-statuses' ].filter(Boolean).join(' ')
          });

          if (res.props.children[0]) {
            res.props.children[0] = AvatarComponent;
          } else {
            res = AvatarComponent;
          }

          return res;
        };
      }

      return res;
    });
  }
};
