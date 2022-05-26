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

const { React, getModule, getModuleByDisplayName } = require('powercord/webpack');
const { findInReactTree } = require('powercord/util');
const { uninject } = require('powercord/injector');

const ClientStatuses = require('./../components/ClientStatuses');
const StatusIcon = require('./../components/StatusIcon');

module.exports = (main) => {
  const ConnectedStatusIcon = powercord.api.settings.connectStores('better-status-indicators')(StatusIcon);
  const ConnectedClientStatuses = powercord.api.settings.connectStores('better-status-indicators')(ClientStatuses);

  const getDefaultMethodByKeyword = (mdl, keyword) => {
    const defaultMethod = mdl.__powercordOriginal_default ?? mdl.default;
    return typeof defaultMethod === 'function' ? defaultMethod.toString().includes(keyword) : null;
  };

  const MessageHeader = getModule(m => getDefaultMethodByKeyword(m, 'showTimestampOnHover'), false);
  main.inject('bsi-message-header-status-icons-1', MessageHeader, 'default', ([ { message: { author: user } } ], res) => {
    const defaultProps = { user, location: 'message-headers' };
    const usernameHeader = findInReactTree(res.props?.username, n => Array.isArray(n?.props?.children) && n.props.children.find(c => c?.props?.message));

    if (usernameHeader?.props?.children && usernameHeader?.props?.children[0] && usernameHeader?.props?.children[0].props) {
      usernameHeader.props.children[0].props.__bsiDefaultProps = defaultProps;
    }

    return res;
  });

  const UsernameHeader = getModule(m => getDefaultMethodByKeyword(m, 'withMentionPrefix'), false);
  main.inject('bsi-message-header-status-icons-2', UsernameHeader, 'default', ([ { __bsiDefaultProps: defaultProps } ], res) => {
    res.props.children.splice(4, 0, [
      <ConnectedStatusIcon {...defaultProps} />,
      <ConnectedClientStatuses {...defaultProps} />
    ]);

    return res;
  });

  [ 'ChannelMessage', 'InboxMessage' ].forEach(component => {
    const mdl = getModule(m => m.type?.displayName === component, false);
    if (mdl) {
      main.inject(`bsi-message-header-fix-${component}`, mdl, 'type', (_, res) => {
        if (res.props.childrenHeader) {
          res.props.childrenHeader.type.type = MessageHeader.default;
        }

        return res;
      });
    }
  });

  const MemberListItem = getModuleByDisplayName('MemberListItem', false) || getModule([ 'AVATAR_DECORATION_PADDING' ], false)?.default;
  const MemberListItemTarget = {
    module: MemberListItem.prototype || MemberListItem,
    method: MemberListItem.prototype ? 'renderDecorators' : 'type'
  };

  main.inject('bsi-member-list-status-icons-1', MemberListItemTarget.module, MemberListItemTarget.method, function (_, res) {
    if (res?.props?.children) {
      const { activities, status, user } = this.props;
      const defaultProps = { user, location: 'members-list' };

      res.props.children.unshift([
        <ConnectedStatusIcon activities={activities} status={status} {...defaultProps} />,
        <ConnectedClientStatuses status={status} {...defaultProps} />
      ]);
    } else {
      const MemberListItem = res.type;
      main.inject('bsi-member-list-status-icons-2', MemberListItem.prototype, 'renderDecorators', function (_, res) {
        const { activities, status, user } = this.props;
        const defaultProps = { user, location: 'members-list' };

        res.props.children.unshift([
          <ConnectedStatusIcon activities={activities} status={status} {...defaultProps} />,
          <ConnectedClientStatuses status={status} {...defaultProps} />
        ]);

        return res;
      });

      uninject('bsi-member-list-status-icons-1');
    }

    return res;
  });

  const DiscordTag = getModule(m => m.default?.displayName === 'DiscordTag', false);
  main.inject('bsi-name-tag-status-icons-1', DiscordTag, 'default', ([ { user } ], res) => {
    res.props.user = user;

    return res;
  });

  const UserStore = getModule([ 'initialize', 'getCurrentUser' ], false);
  const NameTag = getModule(m => m.default?.displayName === 'NameTag', false);
  main.inject('bsi-name-tag-status-icons-2', NameTag, 'default', ([ props ], res) => {
    const user = props.user || UserStore.findByTag(props.name, props.discriminator);
    const defaultProps = { user, location: 'user-popout-modal' };

    res.props.children.splice(2, 0, [
      <ConnectedStatusIcon {...defaultProps} />,
      <ConnectedClientStatuses {...defaultProps} />
    ]);

    return res;
  });

  const PrivateChannel = getModuleByDisplayName('PrivateChannel', false);
  main.inject('bsi-dm-channel-status-icons', PrivateChannel.prototype, 'render', function (_, res) {
    if (!this.props.user) {
      return res;
    }

    const { activities, status, user } = this.props;
    const defaultProps = { user, location: 'direct-messages' };

    if (typeof res.props.children === 'function') {
      res.props.children = (oldMethod => (props) => {
        const res = oldMethod(props);

        const DecoratorsComponent = findInReactTree(res, n => n.props?.hasOwnProperty('decorators'));
        const decorators = Array.isArray(DecoratorsComponent.props.decorators) ? DecoratorsComponent.props.decorators : [ DecoratorsComponent.props.decorators ];

        DecoratorsComponent.props.decorators = [
          ...decorators,
          <ConnectedStatusIcon activities={activities} status={status} {...defaultProps} />,
          <ConnectedClientStatuses status={status} {...defaultProps} />
        ];

        return res;
      })(res.props.children);
    }

    return res;
  });
};
