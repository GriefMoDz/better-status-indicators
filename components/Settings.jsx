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
const { React, i18n: { Messages } } = require('powercord/webpack');
const { FormTitle, Text, modal: { Confirm } } = require('powercord/components');
const { SwitchItem, RadioGroup } = require('powercord/components/settings');
const { open: openModal } = require('powercord/modal');

function formatClientTranslation (translation, args) {
  const key = translation === 'DISPLAY_TITLE' ? 'CLIENT_DISPLAY_TITLE' : `CLIENT_SWITCH_${translation}`;
  return Messages.BSI[key].format(args);
}

function handleAvatarStatusChange () {
  return openModal(() => React.createElement(Confirm, {
    header: Messages.BSI.MOBILE_AVATAR_STATUS_MODAL_HEADER,
    confirmText: Messages.OKAY,
    cancelText: Messages.CANCEL,
    onConfirm: () => {
      this.props.toggleSetting('mobileAvatarStatus', true);
      setTimeout(() => location.reload(), 2e3);
    }
  }, React.createElement(Text, {}, Messages.BSI.MOBILE_AVATAR_STATUS_MODAL_BODY)));
}

module.exports = class Settings extends React.PureComponent {
  render () {
    return <>
      <FormTitle tag='h2' className='bsi-title'>{Messages.SETTINGS}</FormTitle>
      {this.renderSettings()}
    </>;
  }

  renderSettings () {
    const { getSetting, toggleSetting } = this.props;

    return <>
      <RadioGroup
        options={[
          { name: Messages.BSI.STATUS_DISPLAY_SOLID_OPT, value: 'solid' },
          { name: Messages.BSI.STATUS_DISPLAY_DEFAULT_OPT, value: 'default' },
          { name: Messages.BSI.STATUS_DISPLAY_CLASSIC_OPT, value: 'classic' }
        ]}
        value={this.props.getSetting('statusDisplay', 'default')}
        onChange={e => {
          this.props.updateSetting('statusDisplay', e.value);
          this.props.main._refreshStatusIcons();
        }}
      >
        {Messages.BSI.STATUS_DISPLAY}
      </RadioGroup>

      <SwitchItem
        note={Messages.BSI.TRUE_STATUS_DESC}
        value={getSetting('trueStatusColor', false)}
        onChange={() => toggleSetting('trueStatusColor', false)}
      >
        {Messages.BSI.TRUE_STATUS}
      </SwitchItem>

      <FormTitle className="bsi-status-display-title">{formatClientTranslation('DISPLAY_TITLE', { clientCapitalized: 'Desktop' })}</FormTitle>
      <SwitchItem
        note={formatClientTranslation('MEMBERS_LIST_DESC', { client: 'desktop' })}
        value={getSetting('desktopMembersList', false)}
        onChange={() => toggleSetting('desktopMembersList', false)}
      >
        {Messages.BSI.CLIENT_SWITCH_MEMBERS_LIST}
      </SwitchItem>
      <SwitchItem
        note={formatClientTranslation('USER_POPOUT_MODAL_DESC', { client: 'desktop' })}
        value={getSetting('desktopUserPopoutModal', false)}
        onChange={() => toggleSetting('desktopUserPopoutModal', false)}
      >
        {Messages.BSI.CLIENT_SWITCH_USER_POPOUT_MODAL}
      </SwitchItem>
      <SwitchItem
        note={formatClientTranslation('DM_DESC', { client: 'desktop' })}
        value={getSetting('desktopDirectMessages', false)}
        onChange={() => toggleSetting('desktopDirectMessages', false)}
      >
        {Messages.BSI.CLIENT_SWITCH_DM}
      </SwitchItem>
      <SwitchItem
        note={formatClientTranslation('MATCH_COLOR_DESC', { client: 'desktop' })}
        value={getSetting('desktopMatchStatus', false)}
        onChange={() => toggleSetting('desktopMatchStatus', false)}
      >
        {Messages.BSI.CLIENT_SWITCH_MATCH_COLOR}
      </SwitchItem>
      <SwitchItem
        note={Messages.BSI.DESKTOP_SWITCH_PRESERVE_STATUS_DESC}
        value={getSetting('desktopPreserveStatus', false)}
        onChange={() => toggleSetting('desktopPreserveStatus', false)}
      >
        {Messages.BSI.CLIENT_SWITCH_PRESERVE_STATUS}
      </SwitchItem>
      <SwitchItem
        note={formatClientTranslation('SHOW_ON_SELF_DESC', { client: 'desktop' })}
        value={getSetting('desktopShowOnSelf', false)}
        onChange={() => toggleSetting('desktopShowOnSelf', false)}
        disabled={getSetting('desktopPreserveStatus', false) === false}
      >
        {Messages.BSI.CLIENT_SWITCH_SHOW_ON_SELF}
      </SwitchItem>

      <FormTitle className="bsi-status-display-title">{formatClientTranslation('DISPLAY_TITLE', { clientCapitalized: 'Mobile' })}</FormTitle>
      <SwitchItem
        note={Messages.BSI.MOBILE_SWITCH_PRESERVE_STATUS_DESC}
        value={getSetting('mobilePreserveStatus', false)}
        onChange={() => toggleSetting('mobilePreserveStatus', false)}
      >
        {Messages.BSI.CLIENT_SWITCH_PRESERVE_STATUS}
      </SwitchItem>
      <SwitchItem
        note={formatClientTranslation('SHOW_ON_SELF_DESC', { client: 'mobile' })}
        value={getSetting('mobileShowOnSelf', false)}
        onChange={() => toggleSetting('mobileShowOnSelf', false)}
        disabled={getSetting('mobilePreserveStatus', false) === false}
      >
        {Messages.BSI.CLIENT_SWITCH_SHOW_ON_SELF}
      </SwitchItem>
      <SwitchItem
        note={formatClientTranslation('AVATAR_STATUS_DESC', { client: 'mobile' })}
        value={getSetting('mobileAvatarStatus', true)}
        onChange={handleAvatarStatusChange.bind(this)}
      >
        {Messages.BSI.CLIENT_SWITCH_AVATAR_STATUS}
      </SwitchItem>

      <FormTitle className="bsi-status-display-title">{formatClientTranslation('DISPLAY_TITLE', { clientCapitalized: 'Web' })}</FormTitle>
      <SwitchItem
        note={formatClientTranslation('MEMBERS_LIST_DESC', { client: 'web' })}
        value={getSetting('webMembersList', true)}
        onChange={() => toggleSetting('webMembersList', true)}
      >
        {Messages.BSI.CLIENT_SWITCH_MEMBERS_LIST}
      </SwitchItem>
      <SwitchItem
        note={formatClientTranslation('USER_POPOUT_MODAL_DESC', { client: 'web' })}
        value={getSetting('webUserPopoutModal', true)}
        onChange={() => toggleSetting('webUserPopoutModal', true)}
      >
        {Messages.BSI.CLIENT_SWITCH_USER_POPOUT_MODAL}
      </SwitchItem>
      <SwitchItem
        note={formatClientTranslation('DM_DESC', { client: 'web' })}
        value={getSetting('webDirectMessages', true)}
        onChange={() => toggleSetting('webDirectMessages', true)}
      >
        {Messages.BSI.CLIENT_SWITCH_DM}
      </SwitchItem>
      <SwitchItem
        note={formatClientTranslation('MATCH_COLOR_DESC', { client: 'web' })}
        value={getSetting('webMatchStatus', false)}
        onChange={() => toggleSetting('webMatchStatus', false)}
      >
        {Messages.BSI.CLIENT_SWITCH_MATCH_COLOR}
      </SwitchItem>
      <SwitchItem
        note={Messages.BSI.WEB_SWITCH_PRESERVE_STATUS_DESC}
        value={getSetting('webPreserveStatus', false)}
        onChange={() => toggleSetting('webPreserveStatus', false)}
      >
        {Messages.BSI.CLIENT_SWITCH_PRESERVE_STATUS}
      </SwitchItem>
      <SwitchItem
        note={formatClientTranslation('SHOW_ON_SELF_DESC', { client: 'web' })}
        value={getSetting('webShowOnSelf', false)}
        onChange={() => toggleSetting('webShowOnSelf', false)}
        disabled={getSetting('webPreserveStatus', false) === false}
      >
        {Messages.BSI.CLIENT_SWITCH_SHOW_ON_SELF}
      </SwitchItem>
      <SwitchItem
        note={formatClientTranslation('SHOW_ON_BOTS_DESC', { client: 'web' })}
        value={getSetting('webShowOnBots', true)}
        onChange={() => toggleSetting('webShowOnBots', true)}
      >
        {Messages.BSI.CLIENT_SWITCH_SHOW_ON_BOTS}
      </SwitchItem>
    </>;
  }
};
