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
const { React, getModule, getModuleByDisplayName, i18n: { Messages } } = require('powercord/webpack');
const { Button, Divider, Flex, FormTitle, Icon, Icons, TabBar, Text, modal: { Confirm } } = require('powercord/components');
const { ColorPickerInput, SwitchItem, RadioGroup } = require('powercord/components/settings');
const { open: openModal } = require('powercord/modal');

const ModuleCard = require('./ModuleCard');
const SettingsCard = require('./SettingsCard');
const StatusPickerPreview = require('./StatusPickerPreview');
const TextInputWithButton = require('./TextInputWithButton');

const colorUtils = getModule([ 'isValidHex' ], false);
const statusStore = getModule([ 'isMobileOnline' ], false);
const Breadcrumbs = getModuleByDisplayName('Breadcrumbs', false);
const breadcrumbClasses = getModule([ 'breadcrumb', 'breadcrumbActive' ], false);

const { availableModules } = require('../modules');

function formatClientTranslation (translation, args) {
  const key = translation === 'DISPLAY_TITLE' ? 'CLIENT_DISPLAY_TITLE' : `CLIENT_SWITCH_${translation}`;
  return Messages[`BSI_${key}`].format(args);
}

function handleSettingChangeAndReload (headerText, setting) {
  return openModal(() => React.createElement(Confirm, {
    header: headerText,
    confirmText: Messages.OKAY,
    cancelText: Messages.CANCEL,
    onConfirm: () => {
      this.props.toggleSetting(setting, true);
      setTimeout(() => location.reload(), 1e3);
    }
  }, React.createElement(Text, {}, Messages.BSI_CHANGE_SETTING_MODAL_BODY)));
}

// @todo: Make settings dynamic to improve readability and performance
module.exports = class Settings extends React.PureComponent {
  constructor (props) {
    super(props);

    this.statusColors = props.main._getDefaultStatusColors();
    this.state = {
      section: 0,
      selectedItem: 'SETTINGS',
      activeColorPicker: ''
    };

    this.settingsSections = {
      SETTINGS: [ 0, 'Settings' ],
      DESKTOP: [ 1, 'Desktop' ],
      MOBILE: [ 2, 'Mobile' ],
      WEB: [ 3, 'Web' ],
      STREAMING: [ 4, 'Streaming' ]
    };
  }

  render () {
    const { section, selectedItem } = this.state;

    return <>
      {this.renderTabBar()}

      <React.Fragment>
        <Flex align={Flex.Align.CENTER} className={breadcrumbClasses.breadcrumbs}>
          {section === 0 && <FormTitle tag='h2' className='bsi-settings-title'>
            {Messages[`${selectedItem !== 'SETTINGS' ? 'BSI_' : ''}${selectedItem}`]}
          </FormTitle>}

          {section !== 0 && <Breadcrumbs
            activeId={section.toString()}
            breadcrumbs={[ this.settingsSections.SETTINGS, Object.values(this.settingsSections).find(section => section[0] === this.state.section) ].map(e => ({
              id: e[0].toString(),
              label: e[1]
            }))}
            onBreadcrumbClick={(section) => this.setState({ section: parseInt(section.id) })}
            renderCustomBreadcrumb={(section, active) => React.createElement(FormTitle, {
              tag: 'h2',
              className: [
                'bsi-settings-title',
                breadcrumbClasses.breadcrumb,
                active ? breadcrumbClasses.breadcrumbActive : breadcrumbClasses.breadcrumbInactive
              ].join(' ')
            }, section.label)}
          ></Breadcrumbs>}
        </Flex>

        {section === 0 && selectedItem === 'SETTINGS' && this.renderSettings()}
        {section === 0 && selectedItem === 'CUSTOMIZE' && this.renderCustomize()}
        {section === 0 && selectedItem === 'MODULES' && this.renderModules()}

        {section === 1 && this.renderDesktopSettings()}
        {section === 2 && this.renderMobileSettings()}
        {section === 3 && this.renderWebSettings()}
        {section === 4 && this.renderStreamSettings()}
      </React.Fragment>
    </>;
  }

  renderTabBar () {
    const { topPill, item } = getModule([ 'topPill' ], false);

    return (
      <div className='bsi-settings-tab-bar'>
        <TabBar
          selectedItem={this.state.selectedItem}
          onItemSelect={selectedItem => this.setState({ section: 0, selectedItem })}
          type={topPill}
        >
          <TabBar.Item className={item} selectedItem={this.state.selectedItem} id='SETTINGS'>
            {Messages.SETTINGS}
          </TabBar.Item>
          <TabBar.Item className={item} selectedItem={this.state.selectedItem} id='CUSTOMIZE'>
            {Messages.BSI_CUSTOMIZE}
          </TabBar.Item>
          <TabBar.Item className={item} selectedItem={this.state.selectedItem} id='MODULES'>
            {Messages.BSI_MODULES}
          </TabBar.Item>
        </TabBar>
      </div>
    );
  }

  renderCustomize () {
    const { activeColorPicker } = this.state;
    const { getSetting, updateSetting, toggleSetting } = this.props;

    const statuses = [ 'online', 'idle', 'dnd', 'offline', 'invisible', 'streaming' ];
    const hasModifiedColor = statuses.some(status => {
      const defaultColor = this.statusColors[status.toUpperCase()];
      return getSetting(`${status}StatusColor`, defaultColor) !== defaultColor;
    });

    return <>
      <Flex direction={Flex.Direction.VERTICAL}>
        <FormTitle>{Messages.BSI_STATUS_COLOR_PICKER} / {Messages.FORM_LABEL_VIDEO_PREVIEW}</FormTitle>
        <Flex>
          <Flex.Child basis='70%'>
            <></> {/* Workaround for constructing a flex child */}
            {statuses.map(status => {
              const defaultColor = this.statusColors[status.toUpperCase()];
              const settingsKey = `${status}StatusColor`;

              return <TextInputWithButton
                placeholder={`${status.charAt(0).toUpperCase()}${status.slice(1)} - ${defaultColor}`}
                buttonText={`${activeColorPicker === status ? 'Close' : 'Open'} Color Picker`}
                buttonColor={getSetting(settingsKey, defaultColor)}
                buttonIcon='fas fa-palette'
                onButtonClick={() => this.setState({ activeColorPicker: activeColorPicker === status ? '' : status })}
                onChange={(value) => ((updateSetting(settingsKey, value === '' ? defaultColor : value), this.props.main._refreshStatusVariables()))}
                defaultValue={getSetting(settingsKey, defaultColor)}
              />;
            })}

            {hasModifiedColor && <Button
              size={Button.Sizes.MIN}
              color={Button.Colors.BRAND}
              className='bsi-reset-colors-button'
              onClick={() => statuses.forEach(status => {
                updateSetting(`${status}StatusColor`, this.statusColors[status.toUpperCase()]);
                this.props.main._refreshStatusVariables();
              })}
            >
              {Messages.BSI_RESTORE_DEFAULT_COLORS}
            </Button>}
          </Flex.Child>

          <Flex.Child basis='auto'>
            <></> {/* Workaround for constructing a flex child */}
            <StatusPickerPreview className={activeColorPicker ? 'animate' : ''} active={activeColorPicker} />
          </Flex.Child>
        </Flex>

        <Text size={Text.Sizes.SIZE_12} style={{ marginTop: 10 }}>{Messages.BSI_STATUS_COLOR_CHANGE_NOTE.format({})}</Text>
      </Flex>

      {activeColorPicker && <ColorPickerInput
        default={colorUtils.hex2int(this.statusColors[activeColorPicker.toUpperCase()])}
        value={colorUtils.hex2int(getSetting(`${activeColorPicker}StatusColor`, '000000'))}
        onChange={(value) => ((updateSetting(`${activeColorPicker}StatusColor`, colorUtils.int2hex(value)), this.props.main._refreshStatusVariables()))}
      />}

      {!activeColorPicker && <Divider/>}

      <RadioGroup
        options={[
          { name: Messages.BSI_STATUS_DISPLAY_SOLID_OPT, value: 'solid' },
          { name: Messages.BSI_STATUS_DISPLAY_DEFAULT_OPT, value: 'default' },
          { name: Messages.BSI_STATUS_DISPLAY_CLASSIC_OPT, value: 'classic' }
        ]}
        value={this.props.getSetting('statusDisplay', 'default')}
        onChange={e => {
          this.props.updateSetting('statusDisplay', e.value);
          this.props.main._refreshMaskLibrary();
        }}
      >
        {Messages.BSI_STATUS_DISPLAY}
      </RadioGroup>

      <SwitchItem
        note={Messages.BSI_THEME_VARIABLES_DESC}
        value={getSetting('themeVariables', false)}
        onChange={(state) => {
          toggleSetting('themeVariables', false);
          this.props.main._refreshStatusVariables(!state);
        }}
      >
        {Messages.BSI_THEME_VARIABLES}
      </SwitchItem>
    </>;
  }

  renderSettings () {
    const { getSetting, toggleSetting } = this.props;

    return <>
      <FormTitle className="bsi-settings-status-display-title">{formatClientTranslation('DISPLAY_TITLE', { clientCapitalized: 'Client' })}</FormTitle>

      <SettingsCard
        buttonText={Messages.BSI_VIEW_SETTINGS}
        hasNextSection={true}
        name={Messages.FORM_LABEL_DESKTOP_ONLY}
        onButtonClick={() => this.setState({ section: 1 })}
        details={[ { text: `8 ${Messages.SETTINGS}` } ]}
        icon={(props) => React.createElement(Icon, { name: 'Monitor', ...props })}
      />

      <SettingsCard
        buttonText={Messages.BSI_VIEW_SETTINGS}
        hasNextSection={true}
        name={Messages.BSI_MOBILE}
        onButtonClick={() => this.setState({ section: 2 })}
        details={[ { text: `5 ${Messages.SETTINGS}` } ]}
        icon={(props) => React.createElement(Icon, { name: 'MobileDevice', ...props })}
      />

      <SettingsCard
        buttonText={Messages.BSI_VIEW_SETTINGS}
        hasNextSection={true}
        name={Messages.BSI_WEB}
        onButtonClick={() => this.setState({ section: 3 })}
        details={[ { text: `8 ${Messages.SETTINGS}` } ]}
        icon={(props) => React.createElement(Icon, { name: 'Public', ...props })}
      />

      <FormTitle className="bsi-settings-status-display-title">{formatClientTranslation('DISPLAY_TITLE', { clientCapitalized: 'Activity' })}</FormTitle>

      <SettingsCard
        buttonText={Messages.BSI_VIEW_SETTINGS}
        hasNextSection={true}
        name={Messages.STATUS_STREAMING}
        onButtonClick={() => this.setState({ section: 4 })}
        details={[ { text: `7 ${Messages.SETTINGS}` } ]}
        icon={(props) => React.createElement(Icon, { name: 'Activity', ...props })}
      />

      <Divider />

      <FormTitle className="bsi-settings-status-display-title">{Messages.BSI_STATUS_DISPLAY}</FormTitle>
      <SwitchItem
        note={Messages.BSI_TRUE_STATUS_DESC}
        value={getSetting('trueStatusColor', false)}
        onChange={() => toggleSetting('trueStatusColor', false)}
      >
        {Messages.BSI_TRUE_STATUS}
      </SwitchItem>
    </>;
  }

  renderModules () {
    const modules = Object.keys(availableModules);
    const settingsProps = (({ getSetting, toggleSetting, updateSetting }) => ({ getSetting, toggleSetting, updateSetting }))(this.props);

    return <>
      <FormTitle className="bsi-settings-status-display-title">{Messages.BSI_AVAILABLE_MODULES.format({ count: modules.length })}</FormTitle>
      <Text size={Text.Sizes.SIZE_12} style={{ marginBottom: 10 }}>{Messages.BSI_MODULES_CHANGE_NOTE.format({})}</Text>

      {modules.map(modId => {
        const mod = availableModules[modId];
        return <ModuleCard
          id={modId}
          name={mod.name}
          description={mod.description || 'No description given.'}
          icon={mod.icon ? (props) => React.createElement(Icon, { name: mod.icon, ...props }) : null}
          settings={mod.settings || []}
          main={this.props.main}
          {...settingsProps}
        />;
      })}
    </>;
  }

  renderDesktopSettings () {
    const { getSetting, toggleSetting } = this.props;

    return <>
      <FormTitle className="bsi-settings-status-display-title">{formatClientTranslation('DISPLAY_TITLE', { clientCapitalized: 'Desktop' })}</FormTitle>
      <SwitchItem
        note={formatClientTranslation('MESSAGE_HEADERS_DESC', { client: 'desktop' })}
        value={getSetting('desktopMessageHeaders', false)}
        onChange={() => toggleSetting('desktopMessageHeaders', false)}
      >
        {Messages.BSI_CLIENT_SWITCH_MESSAGE_HEADERS}
      </SwitchItem>
      <SwitchItem
        note={formatClientTranslation('MEMBERS_LIST_DESC', { client: 'desktop' })}
        value={getSetting('desktopMembersList', false)}
        onChange={() => toggleSetting('desktopMembersList', false)}
      >
        {Messages.BSI_CLIENT_SWITCH_MEMBERS_LIST}
      </SwitchItem>
      <SwitchItem
        note={formatClientTranslation('USER_POPOUT_MODAL_DESC', { client: 'desktop' })}
        value={getSetting('desktopUserPopoutModal', false)}
        onChange={() => toggleSetting('desktopUserPopoutModal', false)}
      >
        {Messages.BSI_CLIENT_SWITCH_USER_POPOUT_MODAL}
      </SwitchItem>
      <SwitchItem
        note={formatClientTranslation('DM_DESC', { client: 'desktop' })}
        value={getSetting('desktopDirectMessages', false)}
        onChange={() => toggleSetting('desktopDirectMessages', false)}
      >
        {Messages.BSI_CLIENT_SWITCH_DM}
      </SwitchItem>
      <SwitchItem
        note={formatClientTranslation('MATCH_COLOR_DESC', { client: 'desktop' })}
        value={getSetting('desktopMatchStatus', false)}
        onChange={() => toggleSetting('desktopMatchStatus', false)}
      >
        {Messages.BSI_CLIENT_SWITCH_MATCH_COLOR}
      </SwitchItem>
      <SwitchItem
        note={Messages.BSI_DESKTOP_SWITCH_PRESERVE_STATUS_DESC}
        value={getSetting('desktopPreserveStatus', false)}
        onChange={() => toggleSetting('desktopPreserveStatus', false)}
      >
        {Messages.BSI_CLIENT_SWITCH_PRESERVE_STATUS}
      </SwitchItem>
      <SwitchItem
        note={Messages.BSI_DESKTOP_SWITCH_UNIVERSAL_STATUS_DESC}
        value={getSetting('desktopUniversalStatus', false)}
        onChange={() => toggleSetting('desktopUniversalStatus', false)}
        disabled={getSetting('desktopPreserveStatus', false) === false}
      >
        {Messages.BSI_DESKTOP_SWITCH_UNIVERSAL_STATUS} <Icons.FontAwesome icon='universal-access-regular' />
      </SwitchItem>
      <SwitchItem
        note={formatClientTranslation('SHOW_ON_SELF_DESC', { client: 'desktop' })}
        value={getSetting('desktopShowOnSelf', false)}
        onChange={() => toggleSetting('desktopShowOnSelf', false)}
        disabled={getSetting('desktopPreserveStatus', false) === false}
      >
        {Messages.BSI_CLIENT_SWITCH_SHOW_ON_SELF}
      </SwitchItem>
    </>;
  }

  renderMobileSettings () {
    const { getSetting, toggleSetting } = this.props;

    return <>
      <FormTitle className="bsi-settings-status-display-title">{formatClientTranslation('DISPLAY_TITLE', { clientCapitalized: 'Mobile' })}</FormTitle>
      <SwitchItem
        note={Messages.BSI_MOBILE_SWITCH_DISABLE_STATUS_DESC}
        value={getSetting('mobileDisabled', false)}
        onChange={handleSettingChangeAndReload.bind(this, Messages.BSI_MOBILE_DISABLE_STATUS_MODAL_HEADER, 'mobileDisabled')}
      >
        {Messages.BSI_MOBILE_SWITCH_DISABLE_STATUS}
      </SwitchItem>
      <SwitchItem
        note={Messages.BSI_MOBILE_SWITCH_PRESERVE_STATUS_DESC}
        value={getSetting('mobilePreserveStatus', false)}
        onChange={() => ((toggleSetting('mobilePreserveStatus', false), statusStore.emitChange()))}
        disabled={getSetting('mobileDisabled', false)}
      >
        {Messages.BSI_CLIENT_SWITCH_PRESERVE_STATUS}
      </SwitchItem>
      <SwitchItem
        note={formatClientTranslation('SHOW_ON_SELF_DESC', { client: 'mobile' })}
        value={getSetting('mobileShowOnSelf', false)}
        onChange={() => toggleSetting('mobileShowOnSelf', false)}
        disabled={getSetting('mobileDisabled', false) || getSetting('mobilePreserveStatus', false) === false}
      >
        {Messages.BSI_CLIENT_SWITCH_SHOW_ON_SELF}
      </SwitchItem>
      <SwitchItem
        note={formatClientTranslation('AVATAR_STATUS_DESC', { client: 'mobile' })}
        value={getSetting('mobileAvatarStatus', true)}
        onChange={handleSettingChangeAndReload.bind(this, Messages.BSI_MOBILE_AVATAR_STATUS_MODAL_HEADER, 'mobileAvatarStatus')}
        disabled={getSetting('mobileDisabled', false)}
      >
        {Messages.BSI_CLIENT_SWITCH_AVATAR_STATUS}
      </SwitchItem>
      <SwitchItem
        note={Messages.BSI_MOBILE_SWITCH_MATCH_COLOR_DESC}
        value={getSetting('mobileMatchStatus', false)}
        onChange={() => toggleSetting('mobileMatchStatus', false)}
        disabled={getSetting('mobileDisabled', false) || getSetting('mobileAvatarStatus', true)}
      >
        {Messages.BSI_CLIENT_SWITCH_MATCH_COLOR}
      </SwitchItem>
    </>;
  }

  renderWebSettings () {
    const { getSetting, toggleSetting } = this.props;

    return <>
      <FormTitle className="bsi-settings-status-display-title">{formatClientTranslation('DISPLAY_TITLE', { clientCapitalized: 'Web' })}</FormTitle>
      <SwitchItem
        note={formatClientTranslation('MESSAGE_HEADERS_DESC', { client: 'web' })}
        value={getSetting('webMessageHeaders', false)}
        onChange={() => toggleSetting('webMessageHeaders', false)}
      >
        {Messages.BSI_CLIENT_SWITCH_MESSAGE_HEADERS}
      </SwitchItem>
      <SwitchItem
        note={formatClientTranslation('MEMBERS_LIST_DESC', { client: 'web' })}
        value={getSetting('webMembersList', true)}
        onChange={() => toggleSetting('webMembersList', true)}
      >
        {Messages.BSI_CLIENT_SWITCH_MEMBERS_LIST}
      </SwitchItem>
      <SwitchItem
        note={formatClientTranslation('USER_POPOUT_MODAL_DESC', { client: 'web' })}
        value={getSetting('webUserPopoutModal', true)}
        onChange={() => toggleSetting('webUserPopoutModal', true)}
      >
        {Messages.BSI_CLIENT_SWITCH_USER_POPOUT_MODAL}
      </SwitchItem>
      <SwitchItem
        note={formatClientTranslation('DM_DESC', { client: 'web' })}
        value={getSetting('webDirectMessages', true)}
        onChange={() => toggleSetting('webDirectMessages', true)}
      >
        {Messages.BSI_CLIENT_SWITCH_DM}
      </SwitchItem>
      <SwitchItem
        note={formatClientTranslation('MATCH_COLOR_DESC', { client: 'web' })}
        value={getSetting('webMatchStatus', false)}
        onChange={() => toggleSetting('webMatchStatus', false)}
      >
        {Messages.BSI_CLIENT_SWITCH_MATCH_COLOR}
      </SwitchItem>
      <SwitchItem
        note={Messages.BSI_WEB_SWITCH_PRESERVE_STATUS_DESC}
        value={getSetting('webPreserveStatus', false)}
        onChange={() => toggleSetting('webPreserveStatus', false)}
      >
        {Messages.BSI_CLIENT_SWITCH_PRESERVE_STATUS}
      </SwitchItem>
      <SwitchItem
        note={formatClientTranslation('SHOW_ON_SELF_DESC', { client: 'web' })}
        value={getSetting('webShowOnSelf', false)}
        onChange={() => toggleSetting('webShowOnSelf', false)}
        disabled={getSetting('webPreserveStatus', false) === false}
      >
        {Messages.BSI_CLIENT_SWITCH_SHOW_ON_SELF}
      </SwitchItem>
      <SwitchItem
        note={formatClientTranslation('SHOW_ON_BOTS_DESC', { client: 'web' })}
        value={getSetting('webShowOnBots', true)}
        onChange={() => toggleSetting('webShowOnBots', true)}
      >
        {Messages.BSI_CLIENT_SWITCH_SHOW_ON_BOTS}
      </SwitchItem>
    </>;
  }

  renderStreamSettings () {
    const { getSetting, toggleSetting } = this.props;

    return <>
      <FormTitle className="bsi-settings-status-display-title">{formatClientTranslation('DISPLAY_TITLE', { clientCapitalized: 'Streaming' })}</FormTitle>
      <SwitchItem
        note={formatClientTranslation('MESSAGE_HEADERS_DESC', { client: 'streaming' })}
        value={getSetting('streamMessageHeaders', true)}
        onChange={() => toggleSetting('streamMessageHeaders', true)}
      >
        {Messages.BSI_CLIENT_SWITCH_MESSAGE_HEADERS}
      </SwitchItem>
      <SwitchItem
        note={formatClientTranslation('MEMBERS_LIST_DESC', { client: 'streaming' })}
        value={getSetting('streamMembersList', true)}
        onChange={() => toggleSetting('streamMembersList', true)}
      >
        {Messages.BSI_CLIENT_SWITCH_MEMBERS_LIST}
      </SwitchItem>
      <SwitchItem
        note={formatClientTranslation('USER_POPOUT_MODAL_DESC', { client: 'streaming' })}
        value={getSetting('streamUserPopoutModal', true)}
        onChange={() => toggleSetting('streamUserPopoutModal', true)}
      >
        {Messages.BSI_CLIENT_SWITCH_USER_POPOUT_MODAL}
      </SwitchItem>
      <SwitchItem
        note={formatClientTranslation('DM_DESC', { client: 'streaming' })}
        value={getSetting('streamDirectMessages', true)}
        onChange={() => toggleSetting('streamDirectMessages', true)}
      >
        {Messages.BSI_CLIENT_SWITCH_DM}
      </SwitchItem>
      <SwitchItem
        note={formatClientTranslation('MATCH_COLOR_DESC', { client: 'streaming' })}
        value={getSetting('streamMatchStatus', true)}
        onChange={() => toggleSetting('streamMatchStatus', true)}
      >
        {Messages.BSI_CLIENT_SWITCH_MATCH_COLOR}
      </SwitchItem>
      <SwitchItem
        note={Messages.BSI_STREAMING_SWITCH_SHOW_ON_SELF_DESC}
        value={getSetting('streamShowOnSelf', false)}
        onChange={() => toggleSetting('streamShowOnSelf', false)}
      >
        {Messages.BSI_CLIENT_SWITCH_SHOW_ON_SELF}
      </SwitchItem>
      <SwitchItem
        note={formatClientTranslation('SHOW_ON_BOTS_DESC', { client: 'streaming' })}
        value={getSetting('streamShowOnBots', true)}
        onChange={() => toggleSetting('streamShowOnBots', true)}
      >
        {Messages.BSI_CLIENT_SWITCH_SHOW_ON_BOTS}
      </SwitchItem>
    </>;
  }
};
