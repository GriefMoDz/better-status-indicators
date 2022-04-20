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

const { React, getModule, getModuleByDisplayName, i18n: { Messages }, constants: { HEXColors } } = require('powercord/webpack');
const { Button, Divider, Flex, FormTitle } = require('powercord/components');
const { ColorPickerInput, SwitchItem, RadioGroup } = require('powercord/components/settings');

(async () => {
  try {
    const GuildSettingsWindow = getModule([ 'open', 'updateGuild' ], false);
    const fakeGuildObj = new getModule([ 'GuildRecord' ], false).GuildRecord({
      id: '1337',
      name: 'Fake Guild',
      ownerId: window.DiscordNative.crashReporter.getMetadata().user_id,
    });

    GuildSettingsWindow.open(fakeGuildObj.id, 'OVERVIEW');

    getModule([ 'popLayer' ], false).popLayer();
  } catch (_) {}
})();

const Icons = require('./Icons');
const ModuleCard = require('./ModuleCard');
const SettingsCard = require('./SettingsCard');
const StatusPickerPreview = require('./StatusPickerPreview');
const TextInputWithButton = require('./TextInputWithButton');

const Lodash = window._;
const ColorUtils = getModule([ 'isValidHex' ], false);

function formatClientTranslation (translation, args) {
  const key = translation === 'DISPLAY_TITLE' ? 'CLIENT_DISPLAY_TITLE' : `CLIENT_SWITCH_${translation}`;
  return Messages[`BSI_${key}`]?.format?.(args);
}

let ModuleManager;

const TabBar = getModuleByDisplayName('TabBar', false);
const Breadcrumbs = getModuleByDisplayName('Breadcrumbs', false);

const SettingsSections = {
  SETTINGS: 0,
  DESKTOP: 1,
  MOBILE: 2,
  WEB: 3,
  STREAMING: 4
};

function getDefaultStatusColors () {
  return {
    ONLINE: HEXColors.STATUS_GREEN_600,
    IDLE: HEXColors.STATUS_YELLOW,
    DND: HEXColors.STATUS_RED,
    INVISIBLE: HEXColors.STATUS_GREY,
    OFFLINE: HEXColors.STATUS_GREY,
    STREAMING: HEXColors.TWITCH
  }
}

function getSectionLabel (section) {
  switch (section) {
    case SettingsSections.SETTINGS:
      return Messages.SETTINGS;
    case SettingsSections.DESKTOP:
      return Messages.FORM_LABEL_DESKTOP_ONLY;
    case SettingsSections.MOBILE:
      return Messages.BSI_MOBILE;
    case SettingsSections.WEB:
      return Messages.BSI_WEB;
    case SettingsSections.STREAMING:
      return Messages.STATUS_STREAMING;
  }
}

function renderTabBar ({ selectedItem, setSelectedItem, setSection }) {
  const { tabBar, tabBarItem } = getModule([ 'tabBar', 'tabBarItem' ], false);
  const handleOnItemSelect = (selectedItem) => {
    setSelectedItem(selectedItem);
    setSection(null);
  };

  return (
    <TabBar
      className={[ 'bsi-settings-tab-bar', tabBar ].filter(Boolean).join(' ')}
      selectedItem={selectedItem}
      onItemSelect={handleOnItemSelect}
      look={TabBar.Looks.BRAND}
      type={TabBar.Types.TOP}
    >
      <TabBar.Item className={tabBarItem} id='SETTINGS'>
        {Messages.SETTINGS}
      </TabBar.Item>
      <TabBar.Item className={tabBarItem} id='CUSTOMIZE'>
        {Messages.BSI_CUSTOMIZE}
      </TabBar.Item>
      <TabBar.Item className={tabBarItem} id='MODULES'>
        {Messages.BSI_MODULES} ({ModuleManager.getModules().length})
      </TabBar.Item>
    </TabBar>
  );
}

function renderBreadcrumb ({ selectedItem, section, setSection }) {
  const breadcrumbClasses = getModule([ 'breadcrumbActive',  'breadcrumbInactive' ], false);

  return <Flex align={Flex.Align.CENTER} className={breadcrumbClasses?.breadcrumbs}>
    {(!section || section === SettingsSections.SETTINGS)
      ? <FormTitle tag='h1' className='bsi-settings-title'>
        {Messages[`${selectedItem !== 'SETTINGS' ? 'BSI_' : ''}${selectedItem}`]}
      </FormTitle>
      : <Breadcrumbs
        activeId={section.toString()}
        breadcrumbs={[ SettingsSections.SETTINGS, section ].map(e => ({
          id: e.toString(),
          label: getSectionLabel(e)
        }))}
        onBreadcrumbClick={section => setSection(parseInt(section.id))}
        renderCustomBreadcrumb={(section, active) => React.createElement(FormTitle, {
          tag: 'h1',
          className: [
            'bsi-settings-title',
            breadcrumbClasses?.breadcrumb,
            active ? breadcrumbClasses?.breadcrumbActive : breadcrumbClasses?.breadcrumbInactive
          ].join(' ')
        }, section.label)}
      ></Breadcrumbs>}
  </Flex>;
}

function renderSectionSettings (section, { getSetting, toggleSetting, updateSetting }) {
  const sections = require('../lib/stores/settingsSections');

  const elements = [];
  const { settings } = sections[section];

  const client = section === 'stream' ? 'streaming' : section;

  Object.keys(settings).forEach(key => {
    const setting = settings[key];
    const description = setting.description !== void 0
      ? (typeof setting.description === 'string' && (/%.+%/).test(setting.description)
        ? formatClientTranslation(setting.description.replace(/%(.+)%/, '$1'), { client })
        : setting.description)
      : '';

    const settingsKey = Lodash.camelCase(`${section}-${key}`);

    switch (setting.type) {
      case 'radio':
        return elements.push(React.createElement(RadioGroup, {
          options: setting.options,
          note: description,
          value: getSetting(settingsKey, setting.defaultValue),
          onChange: (e) => updateSetting(settingsKey, e.value)
        }, setting.name));
      case 'switch':
        elements.push(React.createElement(SwitchItem, {
          note: description,
          value: getSetting(settingsKey, setting.defaultValue),
          onChange: typeof setting.onChange === 'function' ? setting.onChange : () => toggleSetting(settingsKey, setting.defaultValue),
          disabled: setting.disabled !== void 0
            ? (typeof setting.disabled === 'function' ? setting.disabled() : setting.disabled)
            : false
        }, setting.name));
    }
  });

  return <React.Fragment>
    <FormTitle className='bsi-settings-status-display-title'>{formatClientTranslation('DISPLAY_TITLE', { clientCapitalized: Lodash.upperFirst(client) })}</FormTitle>
    {elements}
  </React.Fragment>;
}

function renderSettings ({ setSection }) {
  const sections = require('../lib/stores/settingsSections');

  return <React.Fragment>
    <FormTitle className='bsi-settings-status-display-title'>{formatClientTranslation('DISPLAY_TITLE', { clientCapitalized: 'Client' })}</FormTitle>

    {[ 'desktop', 'mobile', 'web', 'stream' ].map((key, index) => {
      const section = sections[key];
      let customFormTitle = null;

      if (key === 'stream') {
        customFormTitle = <FormTitle className='bsi-settings-status-display-title'>{formatClientTranslation('DISPLAY_TITLE', { clientCapitalized: 'Activity' })}</FormTitle>;
      }

      return [ customFormTitle, <SettingsCard
        buttonText={Messages.BSI_VIEW_SETTINGS}
        hasNextSection={true}
        name={section.name}
        onButtonClick={() => setSection(index + 1)}
        details={[ { text: `${Object.keys(section.settings).length} ${Messages.SETTINGS}` } ]}
        icon={(props) => React.createElement(Icons[section.icon], { ...props })}
      /> ].filter(Boolean);
    })}
  </React.Fragment>;
}

function renderCustomize ({ activeColorPicker, setActiveColorPicker }, props) {
  const { getSetting, updateSetting, toggleSetting, main } = props;

  const statuses = [ 'online', 'idle', 'dnd', 'offline', 'invisible', 'streaming' ];
  const defaultStatusColors = getDefaultStatusColors();
  const hasModifiedDefaults = statuses.some(status => {
    const defaultColor = defaultStatusColors[status.toUpperCase()];
    return getSetting(`${status}StatusColor`, defaultColor) !== defaultColor;
  });

  return <React.Fragment>
    <Flex direction={Flex.Direction.VERTICAL}>
      <FormTitle>{Messages.BSI_STATUS_COLOR_PICKER} & {Messages.FORM_LABEL_VIDEO_PREVIEW}</FormTitle>
      <Flex>
        <Flex.Child basis='70%'>
          <></>
          {statuses.map(status => {
            const defaultColor = defaultStatusColors[status.toUpperCase()];
            const settingsKey = `${status}StatusColor`;

            return <TextInputWithButton
              placeholder={`${status.charAt(0).toUpperCase()}${status.slice(1)} - ${defaultColor}`}
              buttonText={activeColorPicker === status ? Messages.BSI_CLOSE_COLOR_PICKER : Messages.BSI_OPEN_COLOR_PICKER}
              buttonColor={getSetting(settingsKey, defaultColor)}
              buttonIcon='fas fa-palette'
              onButtonClick={() => setActiveColorPicker(activeColorPicker === status ? null : status)}
              onChange={(value) => ((updateSetting(settingsKey, value === '' ? defaultColor : value), main.refreshStatusVariables()))}
              defaultValue={getSetting(settingsKey, defaultColor)}
            />;
          })}

          {hasModifiedDefaults && <Button
            size={Button.Sizes.MIN}
            color={Button.Colors.BRAND}
            className='bsi-reset-colors-button'
            onClick={() => statuses.forEach(status => {
              updateSetting(`${status}StatusColor`, defaultStatusColors[status.toUpperCase()]);
              main.refreshStatusVariables();
            })}
          >
            {Messages.BSI_RESTORE_DEFAULT_COLORS}
          </Button>}
        </Flex.Child>

        <Flex.Child basis='auto'>
          <></>
          <StatusPickerPreview
            className={activeColorPicker ? 'animate' : ''}
            selectedStatus={activeColorPicker}
          />
        </Flex.Child>
      </Flex>
    </Flex>

    {activeColorPicker && <ColorPickerInput
      default={ColorUtils.hex2int(defaultStatusColors[activeColorPicker.toUpperCase()])}
      value={ColorUtils.hex2int(getSetting(`${activeColorPicker}StatusColor`, '000000'))}
      onChange={(value) => ((updateSetting(`${activeColorPicker}StatusColor`, ColorUtils.int2hex(value)), main.refreshStatusVariables()))}
    />}

    {!activeColorPicker && <Divider/>}

    <RadioGroup
      options={[
        { name: Messages.BSI_STATUS_DISPLAY_SOLID_OPT, value: 'solid' },
        { name: Messages.BSI_STATUS_DISPLAY_DEFAULT_OPT, value: 'default' },
        { name: Messages.BSI_STATUS_DISPLAY_CLASSIC_OPT, value: 'classic' }
      ]}
      value={props.getSetting('statusDisplay', 'default')}
      onChange={e => {
        props.updateSetting('statusDisplay', e.value);
        main.refreshMaskLibrary();
      }}
    >
      {Messages.BSI_STATUS_DISPLAY}
    </RadioGroup>

    <SwitchItem
      note={Messages.BSI_THEME_VARIABLES_DESC}
      value={getSetting('themeVariables', false)}
      onChange={(state) => {
        toggleSetting('themeVariables', false);
        main.refreshStatusVariables(!state);
      }}
    >
      {Messages.BSI_THEME_VARIABLES}
    </SwitchItem>
  </React.Fragment>;
}

function renderModules ({ getSetting, toggleSetting, updateSetting, main }) {
  const modules = ModuleManager.getModules();

  return <React.Fragment>
    <FormTitle className='bsi-settings-status-display-title'>{Messages.BSI_AVAILABLE_MODULES?.format?.({ count: modules.length })}</FormTitle>

    {modules.map(modId => {
      const { manifest } = ModuleManager.get(modId);

      return <ModuleCard
        id={modId}
        name={manifest.name}
        description={manifest.description || 'No description given.'}
        icon={manifest.icon ? (props) => React.createElement(Icons[manifest.icon], { ...props }) : null}
        settings={manifest.settings || []}
        main={main}
        {...{ getSetting, toggleSetting, updateSetting }}
      />;
    })}
  </React.Fragment>;
}

function renderContent (states, props) {
  switch (states.section) {
    case SettingsSections.DESKTOP:
      return renderSectionSettings('desktop', props);
    case SettingsSections.MOBILE:
      return renderSectionSettings('mobile', props);
    case SettingsSections.WEB:
      return renderSectionSettings('web', props);
    case SettingsSections.STREAMING:
      return renderSectionSettings('stream', props);
    default:
      if (states.selectedItem === 'SETTINGS') {
        return renderSettings(states, props);
      } else if (states.selectedItem === 'CUSTOMIZE') {
        return renderCustomize(states, props);
      } else if (states.selectedItem === 'MODULES') {
        return renderModules(props);
      }
  }
}

module.exports = React.memo(props => {
  const [ activeColorPicker, setActiveColorPicker ] = React.useState(null);
  const [ selectedItem, setSelectedItem ] = React.useState('SETTINGS');
  const [ section, setSection ] = React.useState(null);

  const states = {
    activeColorPicker,
    setActiveColorPicker,
    selectedItem,
    setSelectedItem,
    section,
    setSection
  };

  ModuleManager = props.main.ModuleManager;

  return <React.Fragment>
    {renderTabBar(states, props)}
    {renderBreadcrumb(states, props)}
    {renderContent(states, props)}
  </React.Fragment>;
});
