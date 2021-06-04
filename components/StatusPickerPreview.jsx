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

const { React, Flux, getModule } = require('powercord/webpack');
const { AdvancedScrollerThin } = require('powercord/components');

const { Status } = getModule([ 'AnimatedStatus' ], false);
const { humanizeStatus } = getModule([ 'humanizeStatus' ], false);

const classes = {
  ...getModule([ 'menu', 'item' ], false),
  ...getModule([ 'status', 'statusItem' ], false)
};

const StatusMenuItem = React.memo(props => {
  const [ focused, setFocused ] = React.useState(false);
  const { status, selectedStatus } = props;

  return [ <div
    onMouseOver={() => setFocused(true)}
    onMouseOut={() => setFocused(false)}
    className={[ 'status-menu-item', classes.colorDefault, focused && classes.focused, selectedStatus === status && 'status-active' ].filter(Boolean).join(' ')}
    role='menuitem'
  >
    <div className='status-item'>
      <Status status={status} className='status-icon' size={10} color={focused ? 'currentColor' : props.getSetting(`${status}StatusColor`)} />
      <div className='status-text'>{humanizeStatus(status)}</div>
    </div>
  </div>, props.separate && <div role='separator' className='separator' /> ].filter(Boolean);
});

const StatusPickerPreview = React.memo(props => {
  const statuses = [ 'ONLINE', 'IDLE', 'DND', 'OFFLINE', 'INVISIBLE', 'STREAMING' ];

  return <div className={[ classes.menu, props.className ].filter(Boolean).join(' ')} role='menu' id='bsi-status-preview'>
    <AdvancedScrollerThin className='scroller'>
      {statuses.map((status, index) =>
        <StatusMenuItem
          status={status.toLowerCase()}
          separate={(index + 1) !== statuses.length}
          {...props}
        />
      )}
    </AdvancedScrollerThin>
  </div>;
});

module.exports = Flux.connectStores([ powercord.api.settings.store ], () => ({
  ...powercord.api.settings._fluxProps('better-status-indicators')
}))(StatusPickerPreview);
