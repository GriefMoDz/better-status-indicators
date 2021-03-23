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
const { React, FluxDispatcher, getModule, getModuleByDisplayName, i18n: { Messages }, constants: { Colors, StatusTypes } } = require('powercord/webpack');
const { Text, modal: { Confirm } } = require('powercord/components');
const { findInReactTree, waitFor } = require('powercord/util');
const { inject, uninject } = require('powercord/injector');
const { open: openModal } = require('powercord/modal');
const { Plugin } = require('powercord/entities');

const AnimatedAvatarStatus = require('./components/AnimatedAvatarStatus');
const AnimatedStatus = require('./components/AnimatedStatus');
const ClientStatuses = require('./components/ClientStatuses');
const StatusIcon = require('./components/StatusIcon');
const Settings = require('./components/Settings');
// const WebMask = require('./components/WebMask');
const i18n = require('./i18n');

const injectionIds = [];
const modules = require('./modules');
const clientStatusStore = require('./stores/clientStatusStore');

module.exports = class BetterStatusIndicators extends Plugin {
  constructor () {
    super();

    this.AnimatedAvatarStatus = null;
    this.classes = {
      ...getModule([ 'wrapper', 'avatar' ], false),
      avatarWrapper: getModule([ 'avatarHint', 'avatarWrapper' ], false).avatarWrapper
    };
  }

  get clientStatusStore () {
    return clientStatusStore;
  }

  get currentUserId () {
    return window.DiscordNative.crashReporter.getMetadata().user_id;
  }

  get hardwareAccelerationIsEnabled () {
    return window.DiscordNative.gpuSettings.getEnableHardwareAcceleration();
  }

  async startPlugin () {
    this.loadStylesheet('./style.scss');

    powercord.api.i18n.loadAllStrings(i18n);
    powercord.api.settings.registerSettings('better-status-indicators', {
      category: 'better-status-indicators',
      label: 'Better Status Indicators',
      render: (props) => React.createElement(Settings, {
        ...props,
        main: this
      })
    });

    const { getSetting, toggleSetting } = powercord.api.settings._fluxProps(this.entityID);

    const _this = this;

    /* CSS Status Variables */
    if (getSetting('themeVariables', false)) {
      this._refreshStatusVariables(true);
    }

    /* Refresh Status Icons on Locale Change */
    this.handleRefreshIcons = () => this._refreshStatusIcons(true);
    FluxDispatcher.subscribe('I18N_LOAD_SUCCESS', this.handleRefreshIcons);

    /* Hardware Acceleration Notice */
    if (!getSetting('seenHardwareAccelerationNotice', false) && !this.hardwareAccelerationIsEnabled) {
      toggleSetting('seenHardwareAccelerationNotice', true);
      this._hardwareAccelerationDisabled();
    }

    const DiscordUtils = await getModule([ 'setEnableHardwareAcceleration' ]);
    DiscordUtils.setEnableHardwareAcceleration = (enable) => {
      toggleSetting('seenHardwareAccelerationNotice', enable);
      setTimeout(() => window.DiscordNative.gpuSettings.setEnableHardwareAcceleration(enable), 1e3);
    };

    /* Module Loader */
    for (const modId of modules.keys()) {
      const mod = await modules.load(modId);
      const disabledModules = getSetting('disabledModules', [ 'statusEverywhere' ]);

      if (!disabledModules.includes(modId)) {
        mod.startModule(this);
      }
    }

    /* Mobile Status Indicator */
    const statusStore = await getModule([ 'isMobileOnline' ]);
    this.inject('bsi-mobile-status-online', statusStore, 'isMobileOnline', function ([ userId ], res) {
      if (getSetting('mobileDisabled', false)) {
        return false;
      }

      const showOnSelf = userId === _this.currentUserId && getSetting('mobileShowOnSelf', false);
      const clientStatus = showOnSelf ? clientStatusStore.getCurrentClientStatus() : this.getState().clientStatuses[userId];
      if (clientStatus && clientStatus.mobile && (getSetting('mobilePreserveStatus', false) ? true : !clientStatus.desktop)) {
        return true;
      }

      return res;
    });

    const getStatusMessage = (status) => Messages[`STATUS_${status.toUpperCase()}`];
    const statusUtils = await getModule([ 'humanizeStatus' ]);
    this.inject('bsi-mobile-status-text', statusUtils, 'humanizeStatus', ([ status, isMobile ], res) => {
      if (status !== 'online' && isMobile) {
        return Messages.STATUS_ONLINE_MOBILE.replace(getStatusMessage('online'), getStatusMessage(status));
      }

      return res;
    });

    const statusModule = await getModule([ 'getStatusMask' ]);
    this.inject('bsi-status-colors', statusModule, 'getStatusColor', ([ status ], color) => {
      switch (status) {
        case 'online':
          return getSetting('onlineStatusColor', '#43b581');
        case 'idle':
          return getSetting('idleStatusColor', '#faa61a');
        case 'dnd':
          return getSetting('dndStatusColor', '#f04747');
        case 'streaming':
          return getSetting('streamingStatusColor', '#643da7');
        case 'offline':
          return getSetting('offlineStatusColor', '#636b75');
        case 'invisible':
          return getSetting('invisibleStatusColor', '#747f8d');
      }

      return color;
    });

    this.inject('bsi-mobile-status-mask', statusModule, 'getStatusMask', ([ status, isMobile, isTyping ]) => {
      if (status !== 'online' && isMobile && !isTyping) {
        status = 'online';
      }

      return [ status, isMobile, isTyping ];
    }, true);

    this.inject('bsi-mobile-status-size', statusModule, 'getStatusSize', ([ size, status, isMobile, isTyping ]) => {
      if (status !== 'online' && isMobile && !isTyping) {
        status = 'online';
      }

      return [ size, status, isMobile, isTyping ];
    }, true);

    this.inject('bsi-mobile-status-value', statusModule, 'getStatusValues', (args) => {
      if (args[0].status !== 'online' && args[0].isMobile && !args[0].isTyping) {
        args[0].status = 'online';
      }

      return args;
    }, true);

    const Mask = await getModule([ 'MaskLibrary' ]);
    /*
     * const FocusRingScope = await getModule(m => m.default?.displayName === 'FocusRingScope');
     * this.inject('bsi-web-status-mask', FocusRingScope, 'default', (args) => {
     * if (args[0].containerRef?.current !== document.body) {
     *  return args;
     * }
     *
     * const MaskLibrary = args[0].children[0];
     * const originalType = MaskLibrary?.type?.type;
     *
     * if (originalType) {
     *  MaskLibrary.type = (props) => {
     *    const res = originalType(props);
     *    res.props.children.push(React.createElement(WebMask));
     *
     *    return res;
     *  };
     * }
     *
     * return args;
     * }, true);
     *
     * FocusRingScope.default.displayName = 'FocusRingScope';
     */

    const statusColors = this._getDefaultStatusColors();
    this.inject('bsi-mobile-status', statusModule, 'Status', ([ { isMobile, status, size, color } ], res) => {
      const statusStyle = res.props.children.props.style;
      if (!color) {
        statusStyle.backgroundColor = getSetting(`${status}StatusColor`, statusColors[status.toUpperCase()]);
      }

      if (status !== 'online' && isMobile) {
        res.props = { ...res.props,
          mask: Mask.default.Masks.STATUS_ONLINE_MOBILE,
          height: size * 1.5,
          width: size
        };
      }

      return res;
    });

    statusModule.Status.displayName = 'Status';

    const Status = await getModuleByDisplayName('FluxContainer(Status)');
    this.inject('bsi-mobile-custom-status', Status.prototype, 'render', (_, res) => {
      const StatusComponent = this.hardwareAccelerationIsEnabled ? AnimatedStatus : statusModule.Status;
      const originalProps = res.props;

      res = res.type(originalProps);

      const tooltipChildren = res.props.children(originalProps);
      tooltipChildren.props.children.type = StatusComponent;

      return res;
    });

    const avatarModule = await getModule([ 'AnimatedAvatar' ]);
    this.inject('bsi-mobile-animated-status', avatarModule, 'determineIsAnimated', ([ isTyping, status, lastStatus, isMobile, lastIsMobile ]) => {
      if (status !== 'online' && isMobile && !isTyping) {
        status = 'online';
        isMobile = false;
      }

      return [ isTyping, status, lastStatus, isMobile, lastIsMobile ];
    }, true);

    const userStore = await getModule([ 'getCurrentUser' ]);

    this.inject('bsi-mobile-status-default-mask', avatarModule, 'default', ([ props ], res) => {
      const { size, status, isMobile, isTyping } = props;
      const foreignObject = findInReactTree(res, n => n?.type === 'foreignObject');

      if (status && isMobile && !isTyping) {
        res.props['data-bsi-status'] = status;
        res.props['data-bsi-mobile-avatar-status'] = getSetting('mobileAvatarStatus', true);
      }

      if (status !== 'online' && isMobile && !isTyping) {
        foreignObject.props.mask = `url(#svg-mask-avatar-status-mobile-${size.split('_')[1]})`;

        const tooltip = findInReactTree(res, n => n.type?.displayName === 'Tooltip');
        const { children } = tooltip.props;

        tooltip.props.children = (props) => {
          const res = children(props);

          res.props.children[0].props = { ...res.props.children[0].props, mask: 'url(#svg-mask-status-online-mobile)' };

          return res;
        };
      }

      return res;
    });

    this.inject('bsi-mobile-status-animated-mask', avatarModule.AnimatedAvatar, 'type', ([ props ], res) => {
      if (!this.AnimatedAvatarStatus && res.props.fromStatus) {
        this.AnimatedAvatarStatus = res.type;
      }

      if (this.AnimatedAvatarStatus && props.status !== 'online' && props.isMobile && !props.isTyping) {
        res.type = (props) => React.createElement(AnimatedAvatarStatus, {
          ...props,
          component: this.AnimatedAvatarStatus
        });
      }

      return res;
    });

    this.inject('bsi-true-status-color', avatarModule, 'default', (args) => {
      if (getSetting('trueStatusColor', false) && args[0].status && args[0].statusColor && args[0].statusColor === '#ffffff') {
        args[0].statusColor = statusModule.getStatusColor(args[0].status);
      }

      return args;
    }, true);

    avatarModule.default.Sizes = avatarModule.Sizes;

    /* Avatar Status Indicator - Hardware Acceleration Disabled: Fixes */
    if (!this.hardwareAccelerationIsEnabled) {
      const Avatar = avatarModule.default;
      const UserProfileBody = await this._getUserProfileBody();
      this.inject('bsi-user-profile-avatar-status', UserProfileBody.prototype, 'renderHeader', (_, res) => {
        if (Array.isArray(res.props?.children) && res.props.children[0]) {
          res.props.children[0].type = Avatar;
        }

        return res;
      });

      const UserPopout = await this._getUserPopout();
      this.inject('bsi-user-popout-avatar-status', UserPopout.prototype, 'renderHeader', (_, res) => {
        const avatarContainer = findInReactTree(res, n => n?.props?.className.includes(this.classes.avatarWrapper));
        if (avatarContainer) {
          avatarContainer.props.children[0].type = Avatar;
        }

        return res;
      });

      const PrivateChannel = await getModuleByDisplayName('PrivateChannel');
      inject('bsi-user-dm-avatar-status', PrivateChannel.prototype, 'renderAvatar', (_, res) => {
        res.type = Avatar;

        return res;
      });
    }

    /* Status Indicators */
    const ConnectedStatusIcon = this.settings.connectStore(StatusIcon);
    const ConnectedClientStatuses = this.settings.connectStore(ClientStatuses);

    const MessageHeader = await getModule([ 'MessageTimestamp' ]);
    this.inject('bsi-message-header-client-status1', MessageHeader, 'default', ([ { message: { author: user } } ], res) => {
      const defaultProps = { user, location: 'message-headers' };
      const usernameHeader = findInReactTree(res, n => Array.isArray(n?.props?.children) && n.props.children.find(c => c?.props?.message));

      if (usernameHeader?.props?.children && usernameHeader?.props?.children[0] && usernameHeader?.props?.children[0].props) {
        usernameHeader.props.children[0].props.__BsiDefaultProps = defaultProps;
      }

      return res;
    });

    const UsernameHeader = await getModule(m =>
      typeof (m?.__powercordOriginal_default || m.default) === 'function' &&
      (m?.__powercordOriginal_default || m.default).toString().includes('withMentionPrefix')
    );

    this.inject('bsi-message-header-client-status2', UsernameHeader, 'default', ([ { __BsiDefaultProps: defaultProps } ], res) => {
      res.props.children.splice(2, 0, [
        React.createElement(ConnectedStatusIcon, defaultProps),
        React.createElement(ConnectedClientStatuses, defaultProps)
      ]);

      return res;
    });

    const MemberListItem = await getModuleByDisplayName('MemberListItem');
    this.inject('bsi-member-list-client-status', MemberListItem.prototype, 'renderDecorators', function (_, res) {
      const { activities, status, user } = this.props;
      const defaultProps = { user, location: 'members-list' };

      res.props.children.unshift([
        React.createElement(ConnectedStatusIcon, { activities, status, ...defaultProps }),
        React.createElement(ConnectedClientStatuses, { status, ...defaultProps })
      ]);

      return res;
    });

    const NameTag = await getModule(m => m.default?.displayName === 'NameTag');
    this.inject('bsi-name-tag-client-status', NameTag, 'default', ([ props ], res) => {
      const user = userStore.findByTag(props.name, props.discriminator);
      const defaultProps = { user, location: 'user-popout-modal' };

      res.props.children.splice(2, 0, [
        React.createElement(ConnectedStatusIcon, defaultProps),
        React.createElement(ConnectedClientStatuses, defaultProps)
      ]);

      return res;
    });

    NameTag.default.displayName = 'NameTag';

    const PrivateChannel = await getModuleByDisplayName('PrivateChannel');
    this.inject('bsi-dm-channel-client-status', PrivateChannel.prototype, 'render', function (_, res) {
      if (!this.props.user || res.props.decorators) {
        return res;
      }

      const { activities, status, user } = this.props;
      const defaultProps = { user, location: 'direct-messages' };

      res.props.decorators = [
        React.createElement(ConnectedStatusIcon, { activities, status, ...defaultProps }),
        React.createElement(ConnectedClientStatuses, { status, ...defaultProps })
      ];

      return res;
    });

    const { container } = await getModule([ 'container', 'base' ]);
    await waitFor(`.${container}`).then(this.handleRefreshIcons);
  }

  async _getUserPopout () {
    const userStore = await getModule([ 'getCurrentUser' ]);
    const ConnectedUserPopout = await getModuleByDisplayName('ConnectedUserPopout');

    const ogGetCurrentUser = userStore.getCurrentUser;

    userStore.getCurrentUser = () => ({ id: 0 });

    const owo = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current;
    const ogUseMemo = owo.useMemo;
    const ogUseState = owo.useState;
    const ogUseEffect = owo.useEffect;
    const ogUseLayoutEffect = owo.useLayoutEffect;
    const ogUseRef = owo.useRef;

    owo.useMemo = (fn) => fn();
    owo.useState = (value) => [ value, () => void 0 ];
    owo.useEffect = () => null;
    owo.useLayoutEffect = () => null;
    owo.useRef = () => ({});

    const res = new ConnectedUserPopout({ user: { isNonUserBot: () => void 0 } }).type;

    owo.useMemo = ogUseMemo;
    owo.useState = ogUseState;
    owo.useEffect = ogUseEffect;
    owo.useLayoutEffect = ogUseLayoutEffect;
    owo.useRef = ogUseRef;

    userStore.getCurrentUser = ogGetCurrentUser;

    return res;
  }

  async _getUserProfileBody () {
    const UserProfile = (await getModuleByDisplayName('UserProfile')).prototype.render().type
      .prototype.render.call({ memoizedGetStateFromStores: () => null }).type.render().type
      .prototype.render.call({ props: { forwardedRef: null } }).type;

    return UserProfile;
  }

  _refreshStatusVariables (mount) {
    if (mount) {
      return this.loadStylesheet('./variables.scss');
    }

    for (const id in this.styles) {
      const stylesheet = this.styles[id];
      const filename = stylesheet.compiler.file;

      if (filename.endsWith('variables.scss')) {
        stylesheet.compiler.on('src-update', stylesheet.compile);
        stylesheet.compiler.disableWatcher();

        document.getElementById(`style-${this.entityID}-${id}`).remove();

        delete this.styles[id];
      }
    }
  }

  _refreshStatusIcons (initialize = false, restore = false) {
    const MaskLibrary = document.querySelector('#app-mount > svg');

    const filteredStatuses = [ 'idle', 'dnd', 'offline', 'streaming' ];
    const statusMasks = [ ...MaskLibrary.childNodes ].filter(node => filteredStatuses.includes(node.id.split('svg-mask-status-').pop()));

    const restoreMasks = () => statusMasks.forEach(node => {
      const clone = document.querySelector(`#${node.id}-original`).cloneNode(true);
      clone.id = node.id;

      MaskLibrary.replaceChild(clone, node);
    });

    if (initialize) {
      statusMasks.forEach(node => {
        const clone = node.cloneNode(true);
        clone.id = `${node.id}-original`;

        if (!MaskLibrary.querySelector(`#${clone.id}`)) {
          MaskLibrary.appendChild(clone);
        }
      });
    }

    const statusDisplay = this.settings.get('statusDisplay', 'default');
    if (statusDisplay !== 'default' && restore) {
      restoreMasks();
    }

    switch (statusDisplay) {
      case 'solid':
        return statusMasks.forEach(node => node.childNodes[1].style = 'display: none;');
      case 'classic':
        statusMasks.forEach(node => node.childNodes[1].removeAttribute('style'));

        return statusMasks.filter(node => [ 'idle', 'dnd' ].includes(node.id.split('svg-mask-status-').pop())).forEach(node => {
          if (node.id.includes('dnd')) {
            const rect = node.childNodes[1];
            rect.setAttribute('height', '0.15');
            rect.setAttribute('y', '0.45');

            rect.removeAttribute('rx');
            rect.removeAttribute('ry');
          } else {
            const pointers = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            pointers.setAttribute('fill', 'black');
            pointers.setAttribute('points', '0.52, 0.51 0.84, 0.69 0.75, 0.81 0.37, 0.58 0.37, 0.15 0.52, 0.15');

            const innerCircle = node.childNodes[1];
            node.replaceChild(pointers, innerCircle);
          }

          return node;
        });
      default: restoreMasks();
    }
  }

  _hardwareAccelerationDisabled () {
    powercord.api.notices.sendAnnouncement('bsi-hardware-acceleration-disabled', {
      color: 'blue',
      message: Messages.BSI_HARDWARE_ACCELERATION_DISABLED_MSG,
      button: {
        text: Messages.BSI_HARDWARE_ACCELERATION_DISABLED_BTN_TEXT,
        onClick: () => openModal(() => React.createElement(Confirm, {
          header: Messages.SWITCH_HARDWARE_ACCELERATION,
          confirmText: Messages.OKAY,
          cancelText: Messages.CANCEL,
          onConfirm: () => window.DiscordNative.gpuSettings.setEnableHardwareAcceleration(true)
        }, React.createElement(Text, {}, Messages.SWITCH_HARDWARE_ACCELERATION_BODY)))
      }
    });
  }

  _getDefaultStatusColors () {
    const statusColors = {
      ONLINE: 'STATUS_GREEN',
      IDLE: 'STATUS_YELLOW',
      DND: 'STATUS_RED',
      STREAMING: 'TWITCH',
      OFFLINE: 'STATUS_GREY',
      INVISIBLE: 'STATUS_GREY',
      UNKNOWN: 'STATUS_GREY'
    };

    return Object.assign({}, ...Object.keys(StatusTypes).map(status => ({
      [status]: Colors[statusColors[status]]
    })));
  }

  inject (...args) {
    return (injectionIds.push(args[0]), inject(...args));
  }

  pluginWillUnload () {
    injectionIds.forEach(injectionId => uninject(injectionId));

    powercord.api.settings.unregisterSettings('better-status-indicators');

    FluxDispatcher.unsubscribe('I18N_LOAD_SUCCESS', this.handleRefreshIcons);

    this._refreshStatusIcons(false, true);

    for (const modId of modules.keys()) {
      modules.unload(modId);
    }
  }
};
