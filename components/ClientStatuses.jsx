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

const clientStatusStore = require('../stores/clientStatusStore');
const clientIcons = Object.freeze({
  web: 'Public',
  desktop: 'Monitor',
  mobile: 'MobileDevice'
});

function renderClientStatus (client, props, states) {
  if (props.user.bot && !props.getSetting(`${client}ShowOnBots`, true)) {
    return null;
  }

  const matchStatus = props.getSetting(`${client}MatchStatus`, false);
  const clientCapitalized = client.charAt(0).toUpperCase() + client.slice(1);
  const settingsKey = props.location.replace(/^(.)|-(.)/g, (match) => match.toUpperCase()).replace(/-/g, '');

  // eslint-disable-next-line multiline-ternary
  return props.getSetting(`${client}${settingsKey}`, client !== 'desktop') && states[`is${clientCapitalized}Online`] ? React.createElement(Tooltip, {
    text: Messages.BSI.CLIENT_SIGNED_IN.format({ clientCapitalized }),
    hideOnClick: false
  }, (props) => React.createElement(Icon, Object.assign({}, props, {
    name: clientIcons[client],
    className: `bsi-${client}Icon ${getModule([ 'member', 'ownerIcon' ], false).icon}`,
    color: matchStatus ? states.statusColor : 'currentColor'
  }))) : null;
}

function isClientOnline (client, props) {
  if (client === 'mobile' && props.getSetting('mobileAvatarStatus', true)) {
    return false;
  }

  const showOnSelf = props.user.id === authStore.getId() && props.getSetting(`${client}ShowOnSelf`, false);
  const clientStatus = showOnSelf ? clientStatusStore.getCurrentClientStatus() : statusStore.getState().clientStatuses[props.user.id];
  if (!clientStatus) {
    return false;
  }

  const states = {
    web: { preserve: true, nonPreserve: !clientStatus.desktop && !clientStatus.mobile },
    desktop: { preserve: clientStatus.web || clientStatus.mobile, nonPreserve: !clientStatus.web && !clientStatus.mobile },
    mobile: { preserve: clientStatus.desktop || clientStatus.web || true, nonPreserve: !clientStatus.web && !clientStatus.desktop }
  };

  return clientStatus && clientStatus[client] && (props.getSetting(`${client}PreserveStatus`, false) ? states[client].preserve : states[client].nonPreserve);
}

module.exports = React.memo(props => {
  if (!props.user) {
    return null;
  }

  const userStatus = statusStore.getStatus(props.user.id);
  const states = Flux.useStateFromStoresObject([ statusStore ], () => ({
    statusColor: statusUtils.getStatusColor(userStatus),
    isWebOnline: isClientOnline('web', props),
    isDesktopOnline: isClientOnline('desktop', props),
    isMobileOnline: isClientOnline('mobile', props)
  }));

  if (!states.isWebOnline && !states.isDesktopOnline && !states.isMobileOnline) {
    return null;
  }

  return React.createElement('div', { className: 'bsi-clientStatuses' }, [
    renderClientStatus('web', props, states),
    renderClientStatus('desktop', props, states),
    renderClientStatus('mobile', props, states)
  ]);
});
