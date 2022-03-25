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
const { humanizeStatus } = getModule([ 'humanizeStatus' ], false) || {};

const { joinClassNames } = require('../lib/utils');
const { StatusTypes } = require('../lib/constants');

const Status = getModule([ 'AnimatedStatus' ], false).Status || (() => null);

const statuses = Object.values(StatusTypes);
const classes = {
  ...getModule([ 'status', 'statusItem' ], false),
  ...getModule([ 'menu', 'item' ], false)
};

const StatusMenuItem = React.memo(props => {
  const [ focused, setFocused ] = React.useState(false);
  const { status, selectedStatus } = props;

  return <React.Fragment>
    <div
      onMouseOver={() => setFocused(true)}
      onMouseOut={() => setFocused(false)}
      className={joinClassNames('status-menu-item', classes?.colorDefault, focused && classes?.focused, selectedStatus === status && 'status-active')}
      data-status={status}
      role='menuitem'
    >
      <div className='status-item'>
        <Status status={status} className='status-icon' size={10} color={focused ? 'currentColor' : props.getSetting(`${status}StatusColor`)} />
        <div className='status-text'>{humanizeStatus?.(status)}</div>
      </div>
    </div>

    {props.separate && <div role='separator' className='separator' />}
  </React.Fragment>;
});

const StatusPickerPreview = React.memo(props =>
  <div className={joinClassNames(classes?.menu, props.className)} role='menu' id='bsi-status-preview'>
    {statuses.map((status, index) =>
      <StatusMenuItem
        status={status}
        separate={(index + 1) !== statuses.length}
        {...props}
      />
    )}
  </div>
);

module.exports = Flux.connectStores([ powercord.api.settings.store ], () => ({
  ...powercord.api.settings._fluxProps('better-status-indicators')
}))(StatusPickerPreview);
