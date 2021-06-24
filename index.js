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
const { React, ReactDOM, getModule, getModuleByDisplayName, i18n: { Messages }, constants: { StatusTypes } } = require('powercord/webpack');
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
const i18n = require('./i18n');

const modules = require('./modules');
const clientStatusStore = require('./stores/clientStatusStore');

const cache = {};

module.exports = class BetterStatusIndicators extends Plugin {
  constructor () {
    super();

    this.AnimatedAvatarStatus = null;
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

    powercord.api.i18n.loadAllStrings(i18n);
    powercord.api.settings.registerSettings('better-status-indicators', {
      category: 'better-status-indicators',
      label: 'Better Status Indicators',
      render: (props) => React.createElement(Settings, {
        ...props,
        main: this
      })
    });

    const { getSetting, toggleSetting, updateSetting } = powercord.api.settings._fluxProps(this.entityID);

    /* Theme Status Variables */
    if (getSetting('themeVariables', false)) {
      this._refreshStatusVariables();
    }

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
    const disabledModules = getSetting('disabledModules');
    if (disabledModules && disabledModules.length === 0) {
      this.settings.delete('disabledModules');
      updateSetting('enabledModules', [ 'statusEverywhere' ]);
    }

    for (const modId of modules.keys()) {
      const mod = await modules.load(modId);
      const enabledModules = getSetting('enabledModules', []);

      if (enabledModules.includes(modId)) {
        mod.startModule(this);
      }
    }

    /* Mobile Status Indicator */
    const _this = this;

    const statusStore = await getModule([ 'isMobileOnline' ]);
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
          return getSetting('onlineStatusColor', this.defaultStatusColors.ONLINE);
        case 'idle':
          return getSetting('idleStatusColor', this.defaultStatusColors.IDLE);
        case 'dnd':
          return getSetting('dndStatusColor', this.defaultStatusColors.DND);
        case 'streaming':
          return getSetting('streamingStatusColor', this.defaultStatusColors.STREAMING);
        case 'offline':
          return getSetting('offlineStatusColor', this.defaultStatusColors.OFFLINE);
        case 'invisible':
          return getSetting('invisibleStatusColor', this.defaultStatusColors.INVISIBLE);
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

    const Avatar = avatarModule.default;
    const NowPlayingHeader = await getModule(m => m.default?.displayName === 'NowPlayingHeader');
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

    /* Avatar Status Indicator - Hardware Acceleration Disabled: Fixes */
    if (!this.hardwareAccelerationIsEnabled) {
      const UserPopoutComponents = await getModule([ 'UserPopoutAvatar' ]);
      this.inject('bsi-user-popout-avatar-status', UserPopoutComponents, 'UserPopoutAvatar', (_, res) => {
        const avatarComponent = findInReactTree(res, n => n.props?.hasOwnProperty('isMobile'));
        if (avatarComponent) {
          avatarComponent.type = Avatar;
        }

        return res;
      });

      const PrivateChannel = await getModuleByDisplayName('PrivateChannel');
      this.inject('bsi-user-dm-avatar-status', PrivateChannel.prototype, 'renderAvatar', (_, res) => {
        res.type = Avatar;

        return res;
      });
    }

    /* Status Indicators */
    const ConnectedStatusIcon = this.settings.connectStore(StatusIcon);
    const ConnectedClientStatuses = this.settings.connectStore(ClientStatuses);

    const getDefaultMethodByKeyword = (mdl, keyword) => {
      const defaultMethod = mdl.__powercordOriginal_default ?? mdl.default;
      return typeof defaultMethod === 'function' ? defaultMethod.toString().includes(keyword) : null;
    };

    const MessageHeader = await getModule(m => getDefaultMethodByKeyword(m, 'showTimestampOnHover'));
    this.inject('bsi-message-header-client-status1', MessageHeader, 'default', ([ { message: { author: user } } ], res) => {
      const defaultProps = { user, location: 'message-headers' };
      const usernameHeader = findInReactTree(res, n => Array.isArray(n?.props?.children) && n.props.children.find(c => c?.props?.message));

      if (usernameHeader?.props?.children && usernameHeader?.props?.children[0] && usernameHeader?.props?.children[0].props) {
        usernameHeader.props.children[0].props.__bsiDefaultProps = defaultProps;
      }

      return res;
    });

    const UsernameHeader = await getModule(m => getDefaultMethodByKeyword(m, 'withMentionPrefix'));
    this.inject('bsi-message-header-client-status2', UsernameHeader, 'default', ([ { __bsiDefaultProps: defaultProps } ], res) => {
      res.props.children.splice(2, 0, [
        React.createElement(ConnectedStatusIcon, defaultProps),
        React.createElement(ConnectedClientStatuses, defaultProps)
      ]);

      return res;
    });

    [ 'ChannelMessage', 'InboxMessage' ].forEach(async component => {
      const mdl = await getModule(m => m.type?.displayName === component);
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

    const DiscordTag = await getModule(m => m.default?.displayName === 'DiscordTag');
    this.inject('bsi-name-tag-client-status1', DiscordTag, 'default', ([ { user } ], res) => {
      res.props.user = user;

      return res;
    });

    DiscordTag.default.displayName = 'DiscordTag';

    const NameTag = await getModule(m => m.default?.displayName === 'NameTag');
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
      const { container } = await getModule([ 'container', 'base' ]);
      await waitFor(`.${container}`).then(this._refreshMaskLibrary);
    }
  }

  _refreshStatusVariables (unmount = false) {
    const currentStatusVariables = document.querySelector(`#${this.entityID}-status-variables`);

    if (!unmount) {
      const statuses = Object.values(StatusTypes).filter(status => status !== 'unknown');

      const statusVariables = document.createElement('style');
      statusVariables.setAttribute('id', `${this.entityID}-status-variables`);
      statusVariables.textContent = `:root {\n\t${statuses.map(status => (
        `--bsi-${status}-color: ${this.settings.get(`${status}StatusColor`, this.defaultStatusColors[status.toUpperCase()])};`
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

    document.querySelector('#app-mount > svg').replaceWith(tempMaskLibrary.firstChild);
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

    for (const modId of modules.keys()) {
      modules.unload(modId);
    }
  }
};
