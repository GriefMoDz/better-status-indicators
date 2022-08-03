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

const { React, ReactDOM, Flux, FluxDispatcher, getModule, i18n: { Messages }, constants: { StatusTypes } } = require('powercord/webpack');
const { Text, modal: { Confirm } } = require('powercord/components');
const { inject, uninject } = require('powercord/injector');
const { open: openModal } = require('powercord/modal');
const { Plugin } = require('powercord/entities');

const { createLogger } = require('./lib/utils');

const Settings = require('./components/Settings');

const i18n = require('./i18n');
const patches = require('./patches');

const ModuleManager = require('./lib/managers/modules');
const ClientStatusStore = require('./lib/stores/clientStatusStore');

const cache = {};
const Lodash = window._;

const { settings, getSetting, toggleSetting, updateSetting } = powercord.api.settings._fluxProps('better-status-indicators');

const logger = createLogger('Core');

module.exports = class BetterStatusIndicators extends Plugin {
  constructor () {
    super();

    this.AnimatedAvatarStatus = null;
    this.ModuleManager = new ModuleManager(this);
    this.promises = {
      cancelled: false
    };

    for (const logFn of [ 'log', 'debug', 'warn', 'error' ]) {
      this[logFn] = logger[logFn];
    }
  }

  get color () {
    return '#43b581';
  }

  get clientStatusStore () {
    return ClientStatusStore;
  }

  get currentUserId () {
    return window.DiscordNative.crashReporter.getMetadata().user_id;
  }

  get hardwareAccelerationIsEnabled () {
    return window.DiscordNative.gpuSettings.getEnableHardwareAcceleration();
  }

  get _settings () {
    if (cache.settings) {
      return cache.settings;
    }

    const wrapInAvatarRefresh = (method, ...args) => {
      method(...args);
      this.refreshAvatars();
    };

    const newFluxProps = {
      settings,
      getSetting,
      toggleSetting: wrapInAvatarRefresh.bind(this, toggleSetting),
      updateSetting: wrapInAvatarRefresh.bind(this, updateSetting)
    };

    const connectStores = Flux.connectStores([ powercord.api.settings.store ], () => ({ ...newFluxProps }));

    cache.settings = { connectStores, ...newFluxProps };

    return cache.settings;
  }

  startPlugin () {
    const t0 = performance.now();

    this.loadStylesheet('./style.scss');
    this.refreshAvatars = Lodash.debounce(() => FluxDispatcher.dispatch({ type: 'BSI_REFRESH_AVATARS' }), 100);

    powercord.api.i18n.loadAllStrings(i18n);
    powercord.api.settings.registerSettings(this.entityID, {
      category: 'better-status-indicators',
      label: 'Better Status Indicators',
      render: (props) => <Settings
        {...props}
        main={this}
        toggleSetting={this._settings.toggleSetting}
        updateSetting={this._settings.updateSetting}
      />
    });

    this.ColorUtils = getModule([ 'isValidHex' ], false);

    this.fetchDefaultStatusColors();

    /* Theme Status Variables */
    if (getSetting('themeVariables', false)) {
      this.refreshStatusVariables();
    }

    /* Hardware Acceleration Notice */
    if (!getSetting('seenHardwareAccelerationNotice', false) && !this.hardwareAccelerationIsEnabled) {
      toggleSetting('seenHardwareAccelerationNotice', true);
      this.showHWADisabledNotice();
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
    this.ModuleManager.startModules();

    /* Patches */
    for (const patchID of Object.keys(patches)) {
      const logger = createLogger(`Patch:${patchID}`);

      const start = performance.now();
      const patch = patches[patchID];

      (new Promise((resolve) => resolve(patch(this, logger)))
        .catch((e) => logger.error(`An error has occurred while trying to initialize ${patchID}:`, e))
        .then(() => logger.log(`Patch loaded. Initialization took ${Math.floor(performance.now() - start)}ms`))
      );
    }

    this.refreshAvatars();

    /* Custom Status Icons */
    if (getSetting('statusDisplay', 'default') !== 'default') {
      this.refreshMaskLibrary();
    }

    const t1 = performance.now();

    this.log(`Initialization took ${Math.floor(t1 - t0)}ms`);
  }

  hex2hsl (value) {
    const { ColorUtils } = this;

    if (ColorUtils && ColorUtils.isValidHex(value)) {
      const colorInt = ColorUtils.hex2int(value);

      return ColorUtils.int2hsl(colorInt, true);
    }

    return value;
  }

  fetchDefaultStatusColors () {
    const StatusModule = getModule([ 'getStatusMask' ], false);
    const getStatusColor = StatusModule.__powercordOriginal_getStatusColor ?? StatusModule.getStatusColor;

    this.defaultStatusColors = Object.keys(StatusTypes).reduce((statusColors, status) => {
      return { ...statusColors, [status]: getStatusColor(status.toLowerCase()) };
    }, {});
  }

  refreshStatusVariables (unmount = false) {
    const CurrentStatusVariables = document.querySelector(`#${this.entityID}-status-variables`);

    if (!unmount) {
      const statuses = Object.values(StatusTypes).filter(status => status !== 'unknown');

      const StatusVariables = document.createElement('style');
      StatusVariables.setAttribute('id', `${this.entityID}-status-variables`);

      StatusVariables.textContent += ':root {'
      StatusVariables.textContent += '\n\t';
      StatusVariables.textContent += statuses.map(status => (
        `--bsi-${status}-color: ${this.hex2hsl(getSetting(`${status}StatusColor`, this.defaultStatusColors[status.toUpperCase()]))};`
      )).join('\n\t');
      StatusVariables.textContent += '\n';
      StatusVariables.textContent += '}';

      document.body.classList.add('bsi-theme-variables');

      if (CurrentStatusVariables) {
        return CurrentStatusVariables.replaceWith(StatusVariables);
      }

      return document.head.appendChild(StatusVariables);
    }

    document.body.classList.remove('bsi-theme-variables');

    if (CurrentStatusVariables) {
      CurrentStatusVariables.remove();
    }
  }

  refreshMaskLibrary () {
    const Mask = getModule([ 'MaskLibrary' ], false);
    if (Mask === null) {
      return this.error('Missing “MaskLibrary” module; please report this to the developer.');
    }

    const TempMaskContainer = document.createElement('div');
    TempMaskContainer.style.display = 'none';

    document.body.appendChild(TempMaskContainer);

    ReactDOM.render(<Mask.MaskLibrary/>, TempMaskContainer);

    const MaskLibrary = document.querySelector('#app-mount #svg-mask-squircle')?.parentNode;

    if (MaskLibrary) {
      MaskLibrary.innerHTML = TempMaskContainer.firstElementChild.innerHTML;
      TempMaskContainer.remove();
    }
  }

  showHWADisabledNotice () {
    const handleButtonClick = () => openModal((e) => (
      <Confirm
        {...e}
        header={Messages.SWITCH_HARDWARE_ACCELERATION}
        confirmText={Messages.OKAY}
        cancelText={Messages.CANCEL}
        onConfirm={() => window.DiscordNative.gpuSettings.setEnableHardwareAcceleration(!0)}
      >
        <Text>{Messages.SWITCH_HARDWARE_ACCELERATION_BODY}</Text>
      </Confirm>
    ));

    powercord.api.notices.sendAnnouncement('bsi-hardware-acceleration-disabled', {
      color: 'blue',
      message: Messages.BSI_HARDWARE_ACCELERATION_DISABLED_MSG,
      button: {
        text: Messages.BSI_HARDWARE_ACCELERATION_DISABLED_BTN_TEXT,
        onClick: handleButtonClick
      }
    });
  }

  inject (injectionID, ...args) {
    (cache.injections ??= []).push(injectionID);

    const [ mod, method, patch, pre ] = args;

    const errors = [];

    switch (true) {
      case !mod:
        errors.push('Module is missing');
        break;
      case typeof method !== 'string':
        errors.push('Method is not a string');
        break;
      case typeof patch !== 'function':
        errors.push('Patch is not a function');
        break;
      case pre && typeof pre !== 'boolean':
        errors.push('Pre is not a boolean');
    }

    if (errors.length > 0) {
      const logger = createLogger(`Injections:${injectionID}`);

      for (const error of errors) {
        logger.error(`${error}; please report this to the developer.`);
      }

      return;
    }

    inject(injectionID, ...args);

    Object.assign(mod[method], mod[`__powercordOriginal_${method}`]);
  }

  async pluginWillUnload () {
    this.promises.cancelled = true;

    powercord.api.settings.unregisterSettings(this.entityID);

    for (const injectionID of (cache.injections || [])) {
      uninject(injectionID);
    }

    await this.ModuleManager.shutdownModules();

    this.refreshStatusVariables(true);
    this.refreshMaskLibrary();
    this.refreshAvatars();
  }
};
