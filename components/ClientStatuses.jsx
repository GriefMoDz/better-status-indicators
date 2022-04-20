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

const { React, getModule, getModuleByDisplayName, i18n: { Messages } } = require('powercord/webpack');
const Icons = require('./Icons');

const Flux = getModule([ 'useStateFromStores' ], false);
const Tooltip = getModuleByDisplayName('Tooltip', false);

const { getId: getCurrentUserId } = getModule([ 'initialize', 'getFingerprint' ], false);

const statusStore = getModule([ 'isMobileOnline' ], false);
const statusModule = getModule([ 'getStatusColor' ], false);

const classes = getModule([ 'member', 'ownerIcon' ], false);

const clientStatusStore = require('../lib/stores/clientStatusStore');
const clientIcons = Object.freeze({
  web: Icons.Public,
  desktop: Icons.Monitor,
  mobile: Icons.MobileDevice
});

const Lodash = window._;

function renderClientStatus (client, props, states) {
  const clientCapitalized = Lodash.capitalize(client);
  const clientStatus = states.activeSessions[client];

  const matchStatus = props.getSetting(`${client}MatchStatus`, false);
  const iconColor = matchStatus ? statusModule.getStatusColor(clientStatus) : 'currentColor';

  return React.createElement(Tooltip, {
    text: Messages.BSI_CLIENT_SIGNED_IN?.format?.({ clientCapitalized }),
    position: props.tooltipPosition ?? 'top',
    hideOnClick: false
  }, (props) => React.createElement(clientIcons[client], {
    color: iconColor,
    className: `bsi-${client}Icon ${classes.icon}`,
    'data-bsi-status': clientStatus,
    ...props
  }));
}

function shouldClientStatusRender (client, props) {
  if (client === 'mobile' && props.getSetting('mobileAvatarStatus', true)) {
    return false;
  }

  if (props.user.bot && !props.getSetting(`${client}ShowOnBots`, true)) {
    return false;
  }

  const locationKey = Lodash.upperFirst(Lodash.camelCase(props.location));
  if (!props.getSetting(`${client}${locationKey}`, locationKey === 'MessageHeaders' ? client === 'mobile' : client !== 'desktop')) {
    return false;
  }

  const showOnSelf = props.user.id === getCurrentUserId() && props.getSetting(`${client}ShowOnSelf`, false);
  const clientStatus = showOnSelf ? clientStatusStore.getCurrentClientStatus() : statusStore.getState().clientStatuses[props.user.id];
  if (!clientStatus) {
    return false;
  }

  const enabledModules = props.getSetting('enabledModules', []);
  if (enabledModules.includes('avatar-statuses')) {
    if (client === 'web' && clientStatus.desktop) {
      return false;
    }

    if (client === 'web' && !clientStatus.desktop) {
      return false;
    }
  }

  const states = {
    web: { preserve: true, nonPreserve: !clientStatus.desktop && !clientStatus.mobile },
    desktop: {
      preserve: clientStatus.web || clientStatus.mobile || props.getSetting('desktopUniversalStatus', false),
      nonPreserve: !clientStatus.web && !clientStatus.mobile
    },
    mobile: { preserve: clientStatus.desktop || clientStatus.web || true, nonPreserve: !clientStatus.web && !clientStatus.desktop }
  };

  return clientStatus[client] && (props.getSetting(`${client}PreserveStatus`, false)
    ? states[client].preserve
    : states[client].nonPreserve
  );
}

function getActiveSessions (userId) {
  const isCurrentUser = userId === getCurrentUserId();
  const activeSessions = isCurrentUser ? clientStatusStore.getCurrentClientStatus() : statusStore.getState().clientStatuses[userId];

  return activeSessions || {};
}

module.exports = React.memo(props => {
  if (!props.user) {
    return null;
  }

  const states = Flux.useStateFromStoresObject([ statusStore ], () => ({
    statusColor: statusModule.getStatusColor(props.status || statusStore.getStatus(props.user.id)),
    activeSessions: getActiveSessions(props.user.id)
  }));

  const platforms = Object.keys(states.activeSessions).filter(platform => shouldClientStatusRender(platform, props));
  if (platforms.length === 0) {
    return null;
  }

  const clientStatuses = [];

  platforms.sort().forEach(platform => clientStatuses.push(renderClientStatus(platform, props, states)));

  return React.createElement('div', { className: 'bsi-clientStatuses' }, clientStatuses);
});
