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
 * @copyright Copyright (c) 2020 GriefMoDz
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
const { React, getModule, getModuleByDisplayName, i18n: { Messages } } = require('powercord/webpack');
const { Text, modal: { Confirm } } = require('powercord/components');
const { findInReactTree, waitFor } = require('powercord/util');
const { inject, uninject } = require('powercord/injector');
const { open: openModal } = require('powercord/modal');
const { Plugin } = require('powercord/entities');

const AnimatedAvatarStatus = require('./components/AnimatedAvatarStatus');
const AnimatedStatus = require('./components/AnimatedStatus');
const ClientStatuses = require('./components/ClientStatuses');
const Settings = require('./components/Settings');
// const WebMask = require('./components/WebMask');
const i18n = require('./i18n');

const injectionIds = [];
const clientStatusStore = require('./stores/clientStatusStore');

module.exports = class BetterStatusIndicators extends Plugin {
  constructor () {
    super();

    this.AnimatedAvatarStatus = null;
    this.classes = {
      ...getModule([ 'wrapper', 'avatar' ], false),
      disableFlex: getModule([ 'disableFlex' ], false).disableFlex
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
    this.loadStylesheet('./style.css');
    powercord.api.i18n.loadAllStrings(i18n);
    powercord.api.settings.registerSettings('better-status-indicators', {
      category: this.entityID,
      label: 'Better Status Indicators',
      render: (props) => React.createElement(Settings, {
        ...props,
        main: this
      })
    });

    const { getSetting, toggleSetting } = powercord.api.settings._fluxProps(this.entityID);

    const _this = this;

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

    /* Mobile Status Indicator */
    const statusStore = await getModule([ 'isMobileOnline' ]);
    this.inject('bsi-mobile-status-online', statusStore, 'isMobileOnline', function ([ userId ], res) {
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

    this.inject('bsi-mobile-status', statusModule, 'Status', ([ { isMobile, status, size } ], res) => {
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

      const { isMobile, defaultStatus, status, size, streaming, style, className } = originalProps;
      res.props.children = (props) => React.createElement('div', Object.assign({}, props, {
        className: [ this.classes.disableFlex, className ].filter(Boolean).join(' '),
        style
      }), React.createElement(StatusComponent, {
        isMobile,
        status: streaming ? statusModule.StatusTypes.STREAMING : status || defaultStatus,
        size
      }));

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

    this.inject('bsi-mobile-status-default-mask', avatarModule, 'default', (args, res) => {
      const { size, status, isMobile, isTyping } = args[0];
      const foreignObject = findInReactTree(res, n => n?.type === 'foreignObject');

      if (isMobile && !isTyping) {
        foreignObject.props['data-bsi-mobile-avatar-status'] = getSetting('mobileAvatarStatus', true);
      }

      if (status !== 'online' && isMobile && !isTyping) {
        foreignObject.props.mask = `url(#svg-mask-avatar-status-mobile-${size.split('_')[1]})`;
        foreignObject.props['data-bsi-status'] = status;

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

    this.inject('bsi-mobile-status-animated-mask', avatarModule.AnimatedAvatar, 'type', (args, res) => {
      if (!this.AnimatedAvatarStatus && res.props.fromStatus) {
        this.AnimatedAvatarStatus = res.type;
      }

      if (this.AnimatedAvatarStatus && args[0].status !== 'online' && args[0].isMobile && !args[0].isTyping) {
        res.type = (props) => React.createElement(AnimatedAvatarStatus, {
          ...props,
          component: this.AnimatedAvatarStatus
        });
      }

      return res;
    });

    avatarModule.default.Sizes = avatarModule.Sizes;

    this.inject('bsi-true-status-color', avatarModule, 'default', (args) => {
      if (getSetting('trueStatusColor', false) && args[0].statusColor && args[0].statusColor === '#ffffff') {
        args[0].statusColor = statusModule.getStatusColor(args[0].status);
      }

      return args;
    }, true);

    /* Web Status Indicator */
    const ConnectedClientStatuses = this.settings.connectStore(ClientStatuses);

    const MemberListItem = await getModuleByDisplayName('MemberListItem');
    this.inject('bsi-member-list-web-status', MemberListItem.prototype, 'renderDecorators', function (_, res) {
      res.props.children.unshift(React.createElement(ConnectedClientStatuses, { user: this.props.user, location: 'members-list' }));

      return res;
    });

    const userStore = await getModule([ 'getCurrentUser' ]);
    const NameTag = await getModule(m => m.default?.displayName === 'NameTag');
    this.inject('bsi-name-tag-web-status', NameTag, 'default', ([ props ], res) => {
      const user = userStore.findByTag(props.name, props.discriminator);

      res.props.children.splice(2, 0, React.createElement(ConnectedClientStatuses, { user, location: 'user-popout-modal' }));

      return res;
    });

    NameTag.default.displayName = 'NameTag';

    const PrivateChannel = await getModuleByDisplayName('PrivateChannel');
    this.inject('bsi-dm-channel-web-status', PrivateChannel.prototype, 'render', function (_, res) {
      if (!this.props.user || res.props.decorators) {
        return res;
      }

      res.props.decorators = React.createElement(ConnectedClientStatuses, { user: this.props.user, location: 'direct-messages' });

      return res;
    });

    const { container } = await getModule([ 'container', 'base' ]);
    await waitFor(`.${container}`).then(() => this._refreshStatusIcons(true));
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

  inject (...args) {
    injectionIds.push(args[0]);

    return inject(...args);
  }

  pluginWillUnload () {
    injectionIds.forEach(injectionId => uninject(injectionId));

    powercord.api.settings.unregisterSettings('better-status-indicators');

    this._refreshStatusIcons(false, true);
  }
};
