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

const { React, Flux, FluxDispatcher, getModule, getModuleByDisplayName } = require('powercord/webpack');
const { findInReactTree, wrapInHooks } = require('powercord/util');

const AnimatedAvatarStatus = require('./../components/AnimatedAvatarStatus');

module.exports = (main) => {
  const { getSetting } = main._settings;

  const StatusStore = getModule([ 'isMobileOnline' ], false);
  const AvatarModule = getModule([ 'AnimatedAvatar' ], false);

  main.inject('bsi-mobile-animated-status', AvatarModule, 'determineIsAnimated', ([ isTyping, status, lastStatus, isMobile, lastIsMobile ]) => {
    if (status !== 'online' && isMobile && !isTyping) {
      status = 'online';
      isMobile = false;
    }

    return [ isTyping, status, lastStatus, isMobile, lastIsMobile ];
  }, true);

  main.inject('bsi-mobile-status-default-mask', AvatarModule, 'default', ([ props ], res) => {
    const { size, status, isMobile, isTyping } = props;
    const foreignObject = findInReactTree(res, n => n?.type === 'foreignObject');
    const forceUpdate = React.useState({})[1];

    React.useEffect(() => {
      const callback = () => forceUpdate({});

      FluxDispatcher.subscribe('BSI_REFRESH_AVATARS', callback);

      return () => FluxDispatcher.unsubscribe('BSI_REFRESH_AVATARS', callback);
    }, []);

    if (status) {
      res.props['data-bsi-status'] = status;
    }

    const useEnhancedAvatarStatus = main.ModuleManager.isEnabled('avatar-statuses');
    const useMobileAvatarStatus = getSetting('mobileAvatarStatus', true) || useEnhancedAvatarStatus;

    if (status && isMobile && !isTyping) {
      res.props['data-bsi-mobile-avatar-status'] = useMobileAvatarStatus;
    }

    if (status !== 'online' && isMobile && !isTyping && useMobileAvatarStatus) {
      foreignObject.props.mask = `url(#svg-mask-avatar-status-mobile-${size.split('_')[1]})`;

      const tooltip = findInReactTree(res, n => n.type?.displayName === 'Tooltip');
      if (tooltip) {
        const { children } = tooltip.props;

        tooltip.props.children = (props) => {
          const res = children(props);

          res.props.children[0].props = { ...res.props.children[0].props, mask: 'url(#svg-mask-status-online-mobile)' };

          return res;
        };
      }
    }

    return res;
  });

  main.inject('bsi-mobile-status-animated-mask', AvatarModule.AnimatedAvatar, 'type', ([ props ], res) => {
    if (!main.AnimatedAvatarStatus && res.props.fromStatus) {
      main.AnimatedAvatarStatus = res.type;
    }

    if (main.AnimatedAvatarStatus && props.status !== 'online' && props.isMobile && !props.isTyping) {
      res.type = (props) => <AnimatedAvatarStatus {...props} component={main.AnimatedAvatarStatus} />;
    }

    return res;
  });

  const Avatar = main.hardwareAccelerationEnabled ? AvatarModule.AnimatedAvatar : AvatarModule.default;
  const NowPlayingHeader = getModule(m => m.default?.displayName === 'NowPlayingHeader', false);
  main.inject('bsi-now-playing-avatar-status', NowPlayingHeader, 'default', (_, res) => {
    const originalType = res.type;

    res.type = (props) => {
      const res = originalType(props);
      if (props.priorityUser?.user?.id) {
        res.props.children[0].props.isMobile = StatusStore.isMobileOnline(props.priorityUser.user.id);
      }

      res.props.children[0].type = Avatar;

      return res;
    };

    return res;
  });

  const UserPopoutComponents = getModule([ 'UserPopoutAvatar' ], false);
  main.inject('bsi-user-popout-avatar-status', UserPopoutComponents, 'UserPopoutAvatar', ([ props ], res) => {
    const avatarComponent = findInReactTree(res, n => n.props?.hasOwnProperty('isMobile'));
    if (avatarComponent) {
      avatarComponent.type = Avatar;
    }

    const avatarHint = findInReactTree(res, n => n.props?.hasOwnProperty('mask'));
    const useEnhancedAvatarStatus = main.ModuleManager.isEnabled('avatar-statuses');
    const useMobileAvatarStatus = getSetting('mobileAvatarStatus', true) || useEnhancedAvatarStatus;

    if (avatarHint) {
      const isRadialStatusEnabled = main.ModuleManager.isEnabled('radial-status');
      const isEnhancedAvatarStatusEnabled = main.ModuleManager.isEnabled('avatar-statuses');

      if ((useMobileAvatarStatus || isEnhancedAvatarStatusEnabled) && !props.isMobile) {
        avatarHint.props.mask = `svg-mask-avatar-status-round-${avatarHint.props.width}`;
      } else if (!useMobileAvatarStatus && isRadialStatusEnabled) {
        avatarHint.props.mask = 'svg-mask-avatar-default';
      } else if (!useMobileAvatarStatus) {
        avatarHint.props.mask = `svg-mask-avatar-status-round-${avatarHint.props.width}`;
      } else {
        avatarHint.props.mask = !props.isMobile && isRadialStatusEnabled ? 'svg-mask-avatar-default' : avatarHint.props.mask;
      }
    }

    return res;
  });

  const UserProfileModalHeader = getModule(m => m.default?.displayName === 'UserProfileModalHeader', false);
  if (UserProfileModalHeader) {
    main.inject('bsi-user-profile-avatar-status', UserProfileModalHeader, 'default', (_, res) => {
      const avatarComponent = findInReactTree(res, n => n.props?.hasOwnProperty('isMobile'));
      if (avatarComponent) {
        avatarComponent.type = Avatar;
      }

      return res;
    });
  }

  const PrivateChannel = getModuleByDisplayName('PrivateChannel', false);
  main.inject('bsi-user-dm-avatar-status', PrivateChannel.prototype, 'renderAvatar', (_, res) => {
    res.type = Avatar;

    return res;
  });

  const AccountConnected = getModuleByDisplayName('AccountConnected', false);
  const Account = wrapInHooks(() => new AccountConnected())().type;

  if (main.promises.cancelled) {
    return;
  }

  const ConnectedMobileAvatar = Flux.connectStores([ StatusStore ], () => ({
    isMobile: StatusStore.isMobileOnline(main.currentUserId)
  }))(Avatar);

  main.inject('bsi-account-avatar-status', Account.prototype, 'renderAvatarWithPopout', (_, res) => {
    const AvatarWithPopout = findInReactTree(res, n => n.type?.displayName === 'Popout');
    if (typeof AvatarWithPopout?.props?.children === 'function') {
      const oldMethod = AvatarWithPopout.props.children;

      AvatarWithPopout.props.children = (props) => {
        const res = oldMethod(props);
        if (res?.props?.children.type) {
          res.props.children.type = ConnectedMobileAvatar;
        }

        return res;
      };
    }

    return res;
  });
};