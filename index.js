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
const { React, ReactDOM, FluxDispatcher, getModule, getModuleByDisplayName, i18n: { Messages }, constants: { StatusTypes } } = require('powercord/webpack');
const { findInReactTree, getOwnerInstance, waitFor } = require('powercord/util');
const { Text, modal: { Confirm } } = require('powercord/components');
const { inject, uninject } = require('powercord/injector');
const { open: openModal } = require('powercord/modal');
const { Plugin } = require('powercord/entities');

const AnimatedAvatarStatus = require('./components/AnimatedAvatarStatus');
const AnimatedStatus = require('./components/AnimatedStatus');
const ClientStatuses = require('./components/ClientStatuses');
const StatusIcon = require('./components/StatusIcon');
const Settings = require('./components/Settings');
const i18n = require('./i18n');

const ModuleManager = require('./managers/modules');
const clientStatusStore = require('./stores/clientStatusStore');

const cache = {};
const Lodash = window._;

module.exports = class BetterStatusIndicators extends Plugin {
  constructor () {
    super();

    this.AnimatedAvatarStatus = null;
    this.ModuleManager = new ModuleManager(this);
    this.classes = {
      ...getModule([ 'wrapper', 'avatar' ], false),
      avatarWrapper: getModule([ 'avatarHint', 'avatarWrapper' ], false).avatarWrapper
    };
  }

  get color () {
    return '#43b581';
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

  get defaultStatusColors () {
    if (cache.defaultStatusColors) {
      return cache.defaultStatusColors;
    }

    const statusModule = getModule([ 'getStatusMask' ], false);
    const getStatusColor = statusModule.__powercordOriginal_getStatusColor ?? statusModule.getStatusColor;

    cache.defaultStatusColors = (Object.keys(StatusTypes)
      .reduce((statusColors, status) => ({ ...statusColors, [status]: getStatusColor(status.toLowerCase()) }), {})
    );

    return cache.defaultStatusColors;
  }

  async startPlugin () {
    this.loadStylesheet('./style.scss');
    this._refreshAvatars = Lodash.debounce(() => FluxDispatcher.dispatch({ type: 'BSI_REFRESH_AVATARS' }), 500);

    const wrapInAvatarRefresh = (method, ...args) => {
      method(...args);
      this._refreshAvatars();
    };

    this.settings.set = wrapInAvatarRefresh.bind(this, this.settings.set);

    const { getSetting, toggleSetting, updateSetting } = powercord.api.settings._fluxProps(this.entityID);

    powercord.api.i18n.loadAllStrings(i18n);
    powercord.api.settings.registerSettings('better-status-indicators', {
      category: 'better-status-indicators',
      label: 'Better Status Indicators',
      render: (props) => React.createElement(Settings, {
        ...props,
        main: this,
        toggleSetting: wrapInAvatarRefresh.bind(this, toggleSetting),
        updateSetting: wrapInAvatarRefresh.bind(this, updateSetting)
      })
    });

    this.ColorUtils = getModule([ 'isValidHex' ], false);

    /* Theme Status Variables */
    if (getSetting('themeVariables', false)) {
      this._refreshStatusVariables();
    }

    /* Hardware Acceleration Notice */
    if (!getSetting('seenHardwareAccelerationNotice', false) && !this.hardwareAccelerationIsEnabled) {
      toggleSetting('seenHardwareAccelerationNotice', true);
      this._hardwareAccelerationDisabled();
    }

    const DiscordUtils = getModule([ 'setEnableHardwareAcceleration' ], false);
    const { setEnableHardwareAcceleration } = window.DiscordNative.gpuSettings;

    DiscordUtils.setEnableHardwareAcceleration = (enable) => {
      toggleSetting('seenHardwareAccelerationNotice', enable);
      return new Promise((resolve) =>
        setTimeout(() => {
          setEnableHardwareAcceleration(enable);
          resolve();
        }, 1e3)
      );
    };

    /* Module Loader */
    const disabledModules = getSetting('disabledModules');
    if (disabledModules && disabledModules.length === 0) {
      this.settings.delete('disabledModules');
      updateSetting('enabledModules', [ 'statusEverywhere' ]);
    }

    this.ModuleManager.startModules();

    /* Mobile Status Indicator */
    const _this = this;

    const statusStore = getModule([ 'isMobileOnline' ], false);
    statusStore.emitChange();

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
    const statusUtils = getModule([ 'humanizeStatus' ], false);
    this.inject('bsi-mobile-status-text', statusUtils, 'humanizeStatus', ([ status, isMobile ], res) => {
      if (status !== 'online' && isMobile) {
        return Messages.STATUS_ONLINE_MOBILE.replace(getStatusMessage('online'), getStatusMessage(status));
      }

      return res;
    });

    const statusModule = getModule([ 'getStatusMask' ], false);
    this.inject('bsi-status-colors', statusModule, 'getStatusColor', ([ status ]) => {
      switch (status) {
        case 'online':
          return this.hex2hsl(getSetting('onlineStatusColor', this.defaultStatusColors.ONLINE));
        case 'idle':
          return this.hex2hsl(getSetting('idleStatusColor', this.defaultStatusColors.IDLE));
        case 'dnd':
          return this.hex2hsl(getSetting('dndStatusColor', this.defaultStatusColors.DND));
        case 'streaming':
          return this.hex2hsl(getSetting('streamingStatusColor', this.defaultStatusColors.STREAMING));
        case 'offline':
          return this.hex2hsl(getSetting('offlineStatusColor', this.defaultStatusColors.OFFLINE));
        case 'invisible':
          return this.hex2hsl(getSetting('invisibleStatusColor', this.defaultStatusColors.INVISIBLE));
      }

      return this.hex2hsl(getSetting('offlineStatusColor', this.defaultStatusColors.OFFLINE));
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

    const Mask = getModule([ 'MaskLibrary' ], false);
    this.inject('bsi-mobile-status', statusModule, 'Status', ([ { isMobile, status, size, color } ], res) => {
      const statusStyle = res.props.children.props.style;
      if (!color) {
        statusStyle.backgroundColor = getSetting(`${status}StatusColor`, this.defaultStatusColors[status.toUpperCase()]);
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

    const Status = getModuleByDisplayName('FluxContainer(Status)', false);
    this.inject('bsi-mobile-custom-status', Status.prototype, 'render', (_, res) => {
      const StatusComponent = this.hardwareAccelerationIsEnabled ? AnimatedStatus : statusModule.Status;
      const originalProps = res.props;

      res = res.type(originalProps);

      const tooltipChildren = res.props.children(originalProps);
      tooltipChildren.props.children.type = StatusComponent;

      return res;
    });

    const avatarModule = getModule([ 'AnimatedAvatar' ], false);
    this.inject('bsi-mobile-animated-status', avatarModule, 'determineIsAnimated', ([ isTyping, status, lastStatus, isMobile, lastIsMobile ]) => {
      if (status !== 'online' && isMobile && !isTyping) {
        status = 'online';
        isMobile = false;
      }

      return [ isTyping, status, lastStatus, isMobile, lastIsMobile ];
    }, true);

    const userStore = getModule([ 'getCurrentUser' ], false);

    this.inject('bsi-mobile-status-default-mask', avatarModule, 'default', ([ props ], res) => {
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

      if (status && isMobile && !isTyping) {
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

    avatarModule.default.Sizes = avatarModule.Sizes;

    const Avatar = avatarModule.default;
    const NowPlayingHeader = getModule(m => m.default?.displayName === 'NowPlayingHeader', false);
    this.inject('bsi-now-playing-avatar-status', NowPlayingHeader, 'default', (_, res) => {
      const originalType = res.type;

      res.type = (props) => {
        const res = originalType(props);
        if (props.priorityUser?.user?.id) {
          res.props.children[0].props.isMobile = statusStore.isMobileOnline(props.priorityUser.user.id);
        }

        res.props.children[0].type = Avatar;

        return res;
      };

      return res;
    });

    NowPlayingHeader.default.displayName = 'NowPlayingHeader';

    const UserPopoutComponents = getModule([ 'UserPopoutAvatar' ], false);
    this.inject('bsi-user-popout-avatar-status', UserPopoutComponents, 'UserPopoutAvatar', (_, res) => {
      const avatarComponent = findInReactTree(res, n => n.props?.hasOwnProperty('isMobile'));
      if (avatarComponent) {
        avatarComponent.type = Avatar;
      }

      return res;
    });

    const UserProfileModalHeader = getModule(m => m.default?.displayName === 'UserProfileModalHeader', false);
    this.inject('bsi-user-profile-avatar-status', UserProfileModalHeader, 'default', (_, res) => {
      const avatarComponent = findInReactTree(res, n => n.props?.hasOwnProperty('isMobile'));
      if (avatarComponent) {
        avatarComponent.type = Avatar;
      }

      return res;
    });

    UserProfileModalHeader.default.displayName = 'UserProfileModalHeader';

    const { container } = getModule([ 'container', 'usernameContainer' ], false);
    const Account = getOwnerInstance(await waitFor(`.${container}:not(#powercord-spotify-modal)`));
    this.inject('bsi-account-avatar-status', Account.__proto__, 'render', (_, res) => {
      const AvatarWithPopout = findInReactTree(res, n => n.type?.displayName === 'Popout');
      if (AvatarWithPopout) {
        AvatarWithPopout.props.children = (oldMethod => (args) => {
          let res = oldMethod(args);
          if (res?.props?.children) {
            res.props.children.type = Avatar;
          }

          return res;
        })(AvatarWithPopout.props.children);
      }

      return res;
    });

    Account.forceUpdate();

    const PrivateChannel = getModuleByDisplayName('PrivateChannel', false);
    this.inject('bsi-user-dm-avatar-status', PrivateChannel.prototype, 'renderAvatar', (_, res) => {
      res.type = Avatar;

      return res;
    });

    /* Status Indicators */
    const ConnectedStatusIcon = this.settings.connectStore(StatusIcon);
    const ConnectedClientStatuses = this.settings.connectStore(ClientStatuses);

    const getDefaultMethodByKeyword = (mdl, keyword) => {
      const defaultMethod = mdl.__powercordOriginal_default ?? mdl.default;
      return typeof defaultMethod === 'function' ? defaultMethod.toString().includes(keyword) : null;
    };

    const MessageHeader = getModule(m => getDefaultMethodByKeyword(m, 'showTimestampOnHover'), false);
    this.inject('bsi-message-header-client-status1', MessageHeader, 'default', ([ { message: { author: user } } ], res) => {
      const defaultProps = { user, location: 'message-headers' };
      const usernameHeader = findInReactTree(res, n => Array.isArray(n?.props?.children) && n.props.children.find(c => c?.props?.message));

      if (usernameHeader?.props?.children && usernameHeader?.props?.children[0] && usernameHeader?.props?.children[0].props) {
        usernameHeader.props.children[0].props.__bsiDefaultProps = defaultProps;
      }

      return res;
    });

    const UsernameHeader = getModule(m => getDefaultMethodByKeyword(m, 'withMentionPrefix'), false);
    this.inject('bsi-message-header-client-status2', UsernameHeader, 'default', ([ { __bsiDefaultProps: defaultProps } ], res) => {
      res.props.children.splice(2, 0, [
        React.createElement(ConnectedStatusIcon, defaultProps),
        React.createElement(ConnectedClientStatuses, defaultProps)
      ]);

      return res;
    });

    [ 'ChannelMessage', 'InboxMessage' ].forEach(component => {
      const mdl = getModule(m => m.type?.displayName === component, false);
      if (mdl) {
        this.inject(`bsi-message-header-fix-${component}`, mdl, 'type', (_, res) => {
          if (res.props.childrenHeader) {
            res.props.childrenHeader.type.type = MessageHeader.default;
          }

          return res;
        });

        mdl.type.displayName = component;
      }
    });

    const MemberListItem = getModuleByDisplayName('MemberListItem', false);
    this.inject('bsi-member-list-client-status', MemberListItem.prototype, 'renderDecorators', function (_, res) {
      const { activities, status, user } = this.props;
      const defaultProps = { user, location: 'members-list' };

      res.props.children.unshift([
        React.createElement(ConnectedStatusIcon, { activities, status, ...defaultProps }),
        React.createElement(ConnectedClientStatuses, { status, ...defaultProps })
      ]);

      return res;
    });

    const DiscordTag = getModule(m => m.default?.displayName === 'DiscordTag', false);
    this.inject('bsi-name-tag-client-status1', DiscordTag, 'default', ([ { user } ], res) => {
      res.props.user = user;

      return res;
    });

    DiscordTag.default.displayName = 'DiscordTag';

    const NameTag = getModule(m => m.default?.displayName === 'NameTag', false);
    this.inject('bsi-name-tag-client-status2', NameTag, 'default', ([ props ], res) => {
      const user = props.user || userStore.findByTag(props.name, props.discriminator);
      const defaultProps = { user, location: 'user-popout-modal' };

      res.props.children.splice(2, 0, [
        React.createElement(ConnectedStatusIcon, defaultProps),
        React.createElement(ConnectedClientStatuses, defaultProps)
      ]);

      return res;
    });

    NameTag.default.displayName = 'NameTag';

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

    this.inject('bsi-custom-status-masks', Mask.MaskLibrary, 'type', (_, res) => {
      const masks = res.props.children;
      const statusDisplay = getSetting('statusDisplay', 'default');

      const filteredStatuses = [ 'idle', 'dnd', 'offline', 'streaming' ];

      const statusMasks = masks.filter(mask => filteredStatuses.includes(mask.props.id?.split('svg-mask-status-').pop()));
      const idleStatusMask = statusMasks.find(mask => mask.props.id === 'svg-mask-status-idle');
      const dndStatusMask = statusMasks.find(mask => mask.props.id === 'svg-mask-status-dnd');

      switch (statusDisplay) {
        case 'solid':
          statusMasks.forEach(mask => {
            mask.props.children = React.createElement('circle', {
              fill: 'white',
              cx: 0.5,
              cy: 0.5,
              r: 0.5
            });
          });

          break;
        case 'classic':
          idleStatusMask.props.children[1] = React.createElement('polygon', {
            fill: 'black',
            points: '0.52, 0.51 0.84, 0.69 0.75, 0.81 0.37, 0.58 0.37, 0.15 0.52, 0.15'
          });

          Object.assign(dndStatusMask.props.children[1].props, { height: 0.15, y: 0.45 });

          delete dndStatusMask.props.children[1].props.rx;
          delete dndStatusMask.props.children[1].props.ry;
      }

      return res;
    });

    const ErrorBoundary = require('../pc-settings/components/ErrorBoundary');

    const FormSection = await getModuleByDisplayName('FormSection');
    const SettingsView = await getModuleByDisplayName('SettingsView');
    this.inject('bsi-settings-page', SettingsView.prototype, 'getPredicateSections', (_, sections) => {
      const changelog = sections.find(category => category.section === 'changelog');
      if (changelog) {
        const bsiSettingsPage = sections.find(category => category.section === 'better-status-indicators');
        if (bsiSettingsPage) {
          bsiSettingsPage.element = () => React.createElement(ErrorBoundary, {}, React.createElement(FormSection, {
            title: 'Better Status Indicators',
            tag: 'h1'
          }, React.createElement(powercord.api.settings.tabs['better-status-indicators'].render)));
        }
      }

      return sections;
    });

    if (getSetting('statusDisplay', 'default') !== 'default') {
      const { container } = getModule([ 'container', 'base' ], false);
      await waitFor(`.${container}`).then(this._refreshMaskLibrary);
    }

    this._refreshAvatars();
  }

  hex2hsl (value) {
    if (this.ColorUtils.isValidHex(value)) {
      const colorInt = this.ColorUtils.hex2int(value);

      return this.ColorUtils.int2hsl(colorInt, true);
    }

    return value;
  }

  _refreshStatusVariables (unmount = false) {
    const currentStatusVariables = document.querySelector(`#${this.entityID}-status-variables`);

    if (!unmount) {
      const statuses = Object.values(StatusTypes).filter(status => status !== 'unknown');

      const statusVariables = document.createElement('style');
      statusVariables.setAttribute('id', `${this.entityID}-status-variables`);
      statusVariables.textContent = `:root {\n\t${statuses.map(status => (
        `--bsi-${status}-color: ${this.hex2hsl(this.settings.get(`${status}StatusColor`, this.defaultStatusColors[status.toUpperCase()]))};`
      )).join('\n\t')}\n}\n`;

      document.body.classList.add('bsi-theme-variables');

      if (currentStatusVariables) {
        return currentStatusVariables.replaceWith(statusVariables);
      }

      return document.head.appendChild(statusVariables);
    }

    currentStatusVariables.textContent = '';

    document.body.classList.remove('bsi-theme-variables');
  }

  _refreshMaskLibrary () {
    const Mask = getModule([ 'MaskLibrary' ], false);

    const tempMaskLibrary = document.createElement('div');
    ReactDOM.render(React.createElement(Mask.MaskLibrary), tempMaskLibrary);

    document.querySelector('#app-mount > svg').innerHTML = tempMaskLibrary.firstElementChild.innerHTML;
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
          onConfirm: () => window.DiscordNative.gpuSettings.setEnableHardwareAcceleration(!0)
        }, React.createElement(Text, {}, Messages.SWITCH_HARDWARE_ACCELERATION_BODY)))
      }
    });
  }

  inject (...args) {
    if (!cache.injectionIds) {
      cache.injectionIds = [];
    }

    return (inject(...args), cache.injectionIds.push(args[0]));
  }

  pluginWillUnload () {
    powercord.api.settings.unregisterSettings('better-status-indicators');

    cache.injectionIds.forEach(id => uninject(id));
    this._refreshMaskLibrary();

    this.ModuleManager.shutdownModules();

    this._refreshAvatars();
  }
};
