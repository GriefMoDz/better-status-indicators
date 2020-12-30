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
const { React, getModule, i18n: { Messages } } = require('powercord/webpack');
const { Divider, Flex, FormTitle, TabBar, Text, modal: { Confirm } } = require('powercord/components');
const { ColorPickerInput, SwitchItem, RadioGroup } = require('powercord/components/settings');
const { open: openModal } = require('powercord/modal');

const StatusPickerPreview = require('./StatusPickerPreview');
const TextInputWithColorPicker = require('./TextInputWithColorPicker');

const colorUtils = getModule([ 'isValidHex' ], false);

function formatClientTranslation (translation, args) {
  const key = translation === 'DISPLAY_TITLE' ? 'CLIENT_DISPLAY_TITLE' : `CLIENT_SWITCH_${translation}`;
  return Messages[`BSI_${key}`].format(args);
}

function handleAvatarStatusChange () {
  return openModal(() => React.createElement(Confirm, {
    header: Messages.BSI_MOBILE_AVATAR_STATUS_MODAL_HEADER,
    confirmText: Messages.OKAY,
    cancelText: Messages.CANCEL,
    onConfirm: () => {
      this.props.toggleSetting('mobileAvatarStatus', true);
      setTimeout(() => location.reload(), 1e3);
    }
  }, React.createElement(Text, {}, Messages.BSI_MOBILE_AVATAR_STATUS_MODAL_BODY)));
}

module.exports = class Settings extends React.PureComponent {
  constructor (props) {
    super(props);

    this.statusColors = Object.assign({}, ...props.main._getDefaultStatusColors());
    this.state = {
      selectedItem: 'SETTINGS',
      activeColorPicker: ''
    };
  }

  render () {
    const { selectedItem } = this.state;

    return <>
      {this.renderTabBar()}

      <FormTitle tag='h2' className='bsi-settings-title'>{Messages[`${selectedItem !== 'SETTINGS' ? 'BSI_' : ''}${selectedItem}`]}</FormTitle>
      {selectedItem === 'SETTINGS' && this.renderSettings()}
      {selectedItem === 'CUSTOMIZE' && this.renderCustomize()}
    </>;
  }

  renderTabBar () {
    const { topPill, item } = getModule([ 'topPill' ], false);

    return (
      <div className='bsi-settings-tab-bar'>
        <TabBar
          selectedItem={this.state.selectedItem}
          onItemSelect={selectedItem => this.setState({ selectedItem })}
          type={topPill}
        >
          <TabBar.Item className={item} selectedItem={this.state.selectedItem} id='SETTINGS'>
            {Messages.SETTINGS}
          </TabBar.Item>
          <TabBar.Item className={item} selectedItem={this.state.selectedItem} id='CUSTOMIZE'>
            {Messages.BSI_CUSTOMIZE}
          </TabBar.Item>
        </TabBar>
      </div>
    );
  }

  renderCustomize () {
    const { activeColorPicker } = this.state;
    const { getSetting, updateSetting, toggleSetting } = this.props;

    return <>
      <Flex direction={Flex.Direction.VERTICAL}>
        <FormTitle>{Messages.BSI_STATUS_COLOR_PICKER} / {Messages.FORM_LABEL_VIDEO_PREVIEW}</FormTitle>
        <Flex>
          <Flex.Child basis='70%'>
            <></> {/* Workaround for constructing a flex child */}
            {[ 'online', 'idle', 'dnd', 'offline', 'streaming' ].map(status => {
              const defaultColor = this.statusColors[status.toUpperCase()];
              const settingsKey = `${status}StatusColor`;

              return <TextInputWithColorPicker
                placeholder={`${status.charAt(0).toUpperCase()}${status.slice(1)} - ${defaultColor}`}
                buttonText={`${activeColorPicker === status ? 'Close' : 'Open'} Color Picker`}
                buttonColor={getSetting(settingsKey, defaultColor)}
                buttonOnClick={() => this.setState({ activeColorPicker: activeColorPicker === status ? '' : status })}
                onChange={(value) => updateSetting(settingsKey, value === '' ? defaultColor : value)}
                defaultValue={getSetting(settingsKey, defaultColor)}
              />;
            })}
          </Flex.Child>

          <Flex.Child basis='auto'>
            <></> {/* Workaround for constructing a flex child */}
            <StatusPickerPreview className={activeColorPicker ? 'animate' : ''} />
          </Flex.Child>
        </Flex>

        <Text size={Text.Sizes.SIZE_12} style={{ marginTop: 10 }}>{Messages.BSI_STATUS_COLOR_CHANGE_NOTE}</Text>
      </Flex>

      {activeColorPicker && <ColorPickerInput
        default={colorUtils.hex2int(this.statusColors[activeColorPicker.toUpperCase()])}
        value={colorUtils.hex2int(getSetting(`${activeColorPicker}StatusColor`, '000000'))}
        onChange={(value) => updateSetting(`${activeColorPicker}StatusColor`, colorUtils.int2hex(value))}
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
          this.props.main._refreshStatusIcons();
        }}
      >
        {Messages.BSI_STATUS_DISPLAY}
      </RadioGroup>

      <SwitchItem
        note='Adds some variables that are useful for themes (i.e. custom status colors).'
        value={getSetting('themeVariables', false)}
        onChange={() => toggleSetting('themeVariables', false)}
        disabled
      >
        Theme Variables
      </SwitchItem>
    </>;
  }

  renderSettings () {
    const { getSetting, toggleSetting } = this.props;

    return <>
      <FormTitle className="bsi-settings-status-display-title">{Messages.BSI_STATUS_DISPLAY}</FormTitle>
      <SwitchItem
        note={Messages.BSI_TRUE_STATUS_DESC}
        value={getSetting('trueStatusColor', false)}
        onChange={() => toggleSetting('trueStatusColor', false)}
      >
        {Messages.BSI_TRUE_STATUS}
      </SwitchItem>

      <FormTitle className="bsi-settings-status-display-title">{formatClientTranslation('DISPLAY_TITLE', { clientCapitalized: 'Desktop' })}</FormTitle>
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
        note={formatClientTranslation('SHOW_ON_SELF_DESC', { client: 'desktop' })}
        value={getSetting('desktopShowOnSelf', false)}
        onChange={() => toggleSetting('desktopShowOnSelf', false)}
        disabled={getSetting('desktopPreserveStatus', false) === false}
      >
        {Messages.BSI_CLIENT_SWITCH_SHOW_ON_SELF}
      </SwitchItem>

      <FormTitle className="bsi-settings-status-display-title">{formatClientTranslation('DISPLAY_TITLE', { clientCapitalized: 'Mobile' })}</FormTitle>
      <SwitchItem
        note={Messages.BSI_MOBILE_SWITCH_PRESERVE_STATUS_DESC}
        value={getSetting('mobilePreserveStatus', false)}
        onChange={() => toggleSetting('mobilePreserveStatus', false)}
      >
        {Messages.BSI_CLIENT_SWITCH_PRESERVE_STATUS}
      </SwitchItem>
      <SwitchItem
        note={formatClientTranslation('SHOW_ON_SELF_DESC', { client: 'mobile' })}
        value={getSetting('mobileShowOnSelf', false)}
        onChange={() => toggleSetting('mobileShowOnSelf', false)}
        disabled={getSetting('mobilePreserveStatus', false) === false}
      >
        {Messages.BSI_CLIENT_SWITCH_SHOW_ON_SELF}
      </SwitchItem>
      <SwitchItem
        note={formatClientTranslation('AVATAR_STATUS_DESC', { client: 'mobile' })}
        value={getSetting('mobileAvatarStatus', true)}
        onChange={handleAvatarStatusChange.bind(this)}
      >
        {Messages.BSI_CLIENT_SWITCH_AVATAR_STATUS}
      </SwitchItem>

      <FormTitle className="bsi-settings-status-display-title">{formatClientTranslation('DISPLAY_TITLE', { clientCapitalized: 'Web' })}</FormTitle>
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
};
