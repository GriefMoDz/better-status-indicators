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
const { React, getModule, getModuleByDisplayName, i18n: { Messages } } = require('powercord/webpack');
const { Icon } = require('powercord/components');

const Flux = getModule([ 'useStateFromStores' ], false);
const Tooltip = getModuleByDisplayName('Tooltip', false);

const statusStore = getModule([ 'isMobileOnline' ], false);
const statusUtils = getModule([ 'getStatusColor' ], false);
const authStore = getModule([ 'initialize', 'getFingerprint' ], false);
const activityUtils = getModule([ 'isGameActivity', 'renderActivity' ], false);

const { humanizeStatus } = getModule([ 'humanizeStatus' ], false);

function renderStatusIcon (props, states) {
  const showOnBots = props.getSetting('streamShowOnBots', true);
  const showOnSelf = props.getSetting('streamShowOnSelf', false);
  if ((props.user.bot && !showOnBots) || (props.user.id === authStore.getId() && !showOnSelf)) {
    return null;
  }

  const matchStatus = props.getSetting('streamMatchStatus', true);
  const settingsKey = props.location.replace(/^(.)|-(.)/g, (match) => match.toUpperCase()).replace(/-/g, '');

  // eslint-disable-next-line multiline-ternary
  return props.getSetting(`stream${settingsKey}`, true) && states.isStreaming ? React.createElement(Tooltip, {
    text: Messages.BSI_STREAMING_ON_STATUS.format({ status: humanizeStatus(states.status) }),
    hideOnClick: false
  }, (props) => React.createElement(Icon, Object.assign({}, props, {
    name: 'Activity',
    className: `bsi-statusIcon ${getModule([ 'member', 'ownerIcon' ], false).icon}`,
    color: matchStatus ? states.statusColor : 'currentColor'
  }))) : null;
}

module.exports = React.memo(props => {
  if (!props.user) {
    return null;
  }

  const userStatus = statusStore.getStatus(props.user.id);
  const userActivities = statusStore.getActivities(props.user.id);
  const states = Flux.useStateFromStoresObject([ statusStore ], () => ({
    status: userStatus,
    statusColor: statusUtils.getStatusColor(userStatus),
    isStreaming: activityUtils.isStreaming(userActivities)
  }));

  if (!states.isStreaming) {
    return null;
  }

  return renderStatusIcon(props, states);
});
