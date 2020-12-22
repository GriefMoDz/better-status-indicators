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
const { SwitchItem, RadioGroup } = require('powercord/components/settings');
const { FormTitle } = require('powercord/components');

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

      <FormTitle>{Messages.BSI.MOBILE_STATUS_DISPLAY_TITLE}</FormTitle>
      <SwitchItem
        note={Messages.BSI.MOBILE_STATUS_PRESERVE_STATUS_DESC}
        value={getSetting('mobilePreserveStatus', false)}
        onChange={() => toggleSetting('mobilePreserveStatus', false)}
      >
        {Messages.BSI.MOBILE_STATUS_PRESERVE_STATUS}
      </SwitchItem>
      <SwitchItem
        note={Messages.BSI.MOBILE_STATUS_SHOW_ON_SELF_DESC}
        value={getSetting('mobileShowOnSelf', false)}
        onChange={() => toggleSetting('mobileShowOnSelf', false)}
        disabled={getSetting('mobilePreserveStatus', false) === false}
      >
        {Messages.BSI.MOBILE_STATUS_SHOW_ON_SELF}
      </SwitchItem>

      <FormTitle>{Messages.BSI.WEB_STATUS_DISPLAY_TITLE}</FormTitle>
      <SwitchItem
        note={Messages.BSI.WEB_STATUS_MEMBERS_LIST_DESC}
        value={getSetting('webMembersList', true)}
        onChange={() => toggleSetting('webMembersList', true)}
      >
        {Messages.BSI.WEB_STATUS_MEMBERS_LIST}
      </SwitchItem>
      <SwitchItem
        note={Messages.BSI.WEB_STATUS_USER_POPOUT_MODAL_DESC}
        value={getSetting('webUserPopoutModal', true)}
        onChange={() => toggleSetting('webUserPopoutModal', true)}
      >
        {Messages.BSI.WEB_STATUS_USER_POPOUT_MODAL}
      </SwitchItem>
      <SwitchItem
        note={Messages.BSI.WEB_STATUS_DM_DESC}
        value={getSetting('webDirectMessages', true)}
        onChange={() => toggleSetting('webDirectMessages', true)}
      >
        {Messages.BSI.WEB_STATUS_DM}
      </SwitchItem>
      <SwitchItem
        note={Messages.BSI.WEB_STATUS_MATCH_COLOR_DESC}
        value={getSetting('webMatchStatus', false)}
        onChange={() => toggleSetting('webMatchStatus', false)}
      >
        {Messages.BSI.WEB_STATUS_MATCH_COLOR}
      </SwitchItem>
      <SwitchItem
        note={Messages.BSI.WEB_STATUS_PRESERVE_STATUS_DESC}
        value={getSetting('webPreserveStatus', false)}
        onChange={() => toggleSetting('webPreserveStatus', false)}
      >
        {Messages.BSI.WEB_STATUS_PRESERVE_STATUS}
      </SwitchItem>
      <SwitchItem
        note={Messages.BSI.WEB_STATUS_SHOW_ON_SELF_DESC}
        value={getSetting('webShowOnSelf', false)}
        onChange={() => toggleSetting('webShowOnSelf', false)}
        disabled={getSetting('webPreserveStatus', false) === false}
      >
        {Messages.BSI.WEB_STATUS_SHOW_ON_SELF}
      </SwitchItem>
      <SwitchItem
        note={Messages.BSI.WEB_STATUS_SHOW_ON_BOTS_DESC}
        value={getSetting('webShowOnBots', true)}
        onChange={() => toggleSetting('webShowOnBots', true)}
      >
        {Messages.BSI.WEB_STATUS_SHOW_ON_BOTS}
      </SwitchItem>
    </>;
  }
};
