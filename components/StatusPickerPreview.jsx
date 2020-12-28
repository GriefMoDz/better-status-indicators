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

const { React, getModule, i18n: { Messages }, constants } = require('powercord/webpack');
const { Menu } = require('powercord/components');

const { Status } = getModule([ 'AnimatedStatus' ], false);
const { humanizeStatus } = getModule([ 'humanizeStatus' ], false);

const classes = getModule([ 'status', 'statusItem' ], false);

class StatusMenuItem extends React.PureComponent {
  render () {
    const { status, description, focused } = this.props;

    return React.createElement('div', {
      className: classes.statusItem
    }, React.createElement(Status, {
      status,
      className: classes.icon,
      size: 10,
      color: focused ? 'currentColor' : void 0
    }), React.createElement('div', {
      className: classes.status
    }, humanizeStatus(this.props.status)), description && React.createElement('div', {
      className: classes.description
    }, description));
  }
}

module.exports = class StatusPickerPreview extends React.PureComponent {
  render () {
    return <>
      <Menu.Menu navId='bsi-status-picker' style={Menu.MenuStyle.FIXED} aria-label={Messages.SET_STATUS} onClose={() => void 0}>
        <Menu.MenuItem id='online' keepItemStyles={true} render={(props) =>
          <StatusMenuItem
            status={constants.StatusTypes.ONLINE}
            focused={props.isFocused}
          />
        } action={() => void 0} />

        <Menu.MenuSeparator />

        <Menu.MenuItem id='idle' keepItemStyles={true} render={(props) =>
          <StatusMenuItem
            status={constants.StatusTypes.IDLE}
            focused={props.isFocused}
          />
        } action={() => void 0} />
        <Menu.MenuItem id='dnd' keepItemStyles={true} render={(props) =>
          <StatusMenuItem
            status={constants.StatusTypes.DND}
            description={Messages.STATUS_DND_HELP}
            focused={props.isFocused}
          />
        } action={() => void 0} />
        <Menu.MenuItem id='invisible' keepItemStyles={true} render={(props) =>
          <StatusMenuItem
            status={constants.StatusTypes.INVISIBLE}
            description={Messages.STATUS_INVISIBLE_HELPER}
            focused={props.isFocused}
          />
        } action={() => void 0} />

        <Menu.MenuSeparator />

        <Menu.MenuItem id='streaming' keepItemStyles={true} render={(props) =>
          <StatusMenuItem
            status={constants.StatusTypes.STREAMING}
            focused={props.isFocused}
          />
        } action={() => void 0} />
      </Menu.Menu>
    </>;
  }
};
