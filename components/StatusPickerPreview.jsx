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

const { React, Flux, getModule, constants } = require('powercord/webpack');
const { AdvancedScrollerThin } = require('powercord/components');

const { Status } = getModule([ 'AnimatedStatus' ], false);
const { humanizeStatus } = getModule([ 'humanizeStatus' ], false);

const classes = {
  ...getModule([ 'menu', 'item' ], false),
  ...getModule([ 'status', 'statusItem' ], false)
};

class StatusMenuItem extends React.PureComponent {
  constructor () {
    super();

    this.state = {
      focused: false
    };
  }

  render () {
    const { focused } = this.state;
    const { status, description, separator, active } = this.props;

    return [ React.createElement('div', {
      onMouseOver: () => this.setState({ focused: true }),
      onMouseOut: () => this.setState({ focused: false }),
      className: [ classes.item, classes.colorDefault, focused && classes.focused, active === status && 'bsi-status-active' ].filter(Boolean).join(' '),
      role: 'menuitem'
    }, React.createElement('div', {
      className: classes.statusItem
    }, React.createElement(Status, {
      status,
      className: classes.icon,
      size: 10,
      color: focused ? 'currentColor' : this.props.getSetting(`${status}StatusColor`, void 0)
    }), React.createElement('div', {
      className: classes.status
    }, humanizeStatus(status)), description && React.createElement('div', {
      className: classes.description
    }, description))), separator && React.createElement('div', {
      role: 'separator',
      className: 'bsi-status-separator'
    }) ];
  }
}

class StatusPickerPreview extends React.PureComponent {
  render () {
    return <>
      <div className={[ classes.menu, this.props.className ].join(' ')} role='menu' id='bsi-status-picker'>
        <AdvancedScrollerThin className='bsi-status-scroller'>
          {[ 'ONLINE', 'IDLE', 'DND', 'OFFLINE', 'STREAMING' ].map(status =>
            <StatusMenuItem
              status={constants.StatusTypes[status]}
              separator={status !== 'STREAMING'}
              {...this.props }
            />
          )}
        </AdvancedScrollerThin>
      </div>
    </>;
  }
}

module.exports = Flux.connectStores([ powercord.api.settings.store ], () => ({
  ...powercord.api.settings._fluxProps('better-status-indicators')
}))(StatusPickerPreview);
