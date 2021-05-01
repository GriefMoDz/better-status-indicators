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
const { Activity } = require('./Icons');

const Flux = getModule([ 'useStateFromStores' ], false);
const Tooltip = getModuleByDisplayName('Tooltip', false);

const { humanizeStatus } = getModule([ 'humanizeStatus' ], false);
const { isStreaming } = getModule([ 'isGameActivity', 'renderActivity' ], false);
const { getId: getCurrentUserId } = getModule([ 'initialize', 'getFingerprint' ], false);

const StatusUtils = getModule([ 'getStatusColor' ], false);

const statusStore = getModule([ 'isMobileOnline' ], false);
const classes = getModule([ 'member', 'ownerIcon' ], false);

const Lodash = window._;

function renderStatusIcon ({ props, settings }, states) {
  const locationKey = Lodash.upperFirst(Lodash.camelCase(props.location));

  // eslint-disable-next-line multiline-ternary
  return props.getSetting(`stream${locationKey}`, true) ? React.createElement(Tooltip, {
    text: Messages.BSI_STREAMING_AS_STATUS.format({ status: humanizeStatus(states.status) }),
    hideOnClick: false
  }, (props) => React.createElement(Activity, {
    color: settings.matchStatus ? states.statusColor : 'currentColor',
    className: `bsi-statusIcon ${classes.icon}`,
    ...props
  })) : null;
}

module.exports = React.memo(props => {
  const { getSetting } = props;

  const settings = {
    showOnBots: getSetting('streamShowOnBots', true),
    showOnSelf: getSetting('streamShowOnSelf', false),
    matchStatus: getSetting('streamMatchStatus', true)
  };

  if (!props.user || (props.user.bot && !settings.showOnBots) || (props.user.id === getCurrentUserId() && !settings.showOnSelf)) {
    return null;
  }

  const states = Flux.useStateFromStoresObject([ statusStore ], () => ({
    status: props.status || statusStore.getStatus(props.user.id),
    statusColor: StatusUtils.getStatusColor(props.status || statusStore.getStatus(props.user.id)),
    isStreaming: isStreaming(props.activities || statusStore.getActivities(props.user.id))
  }));

  if (!states.isStreaming) {
    return null;
  }

  return renderStatusIcon({ props, settings }, states);
});
