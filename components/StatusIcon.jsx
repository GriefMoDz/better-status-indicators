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
const { Activity } = require('./Icons');

const Flux = getModule([ 'useStateFromStores' ], false);
const Tooltip = getModuleByDisplayName('Tooltip', false);

const { humanizeStatus } = getModule([ 'humanizeStatus' ], false) || {};
const { getId: getCurrentUserId } = getModule([ 'initialize', 'getFingerprint' ], false) || {};

const StatusUtils = getModule([ 'getStatusColor' ], false);
const StatusStore = getModule([ 'isMobileOnline' ], false);
const ActivityStore = getModule([ 'isGameActivity', 'renderActivity' ], false);

const classes = getModule([ 'member', 'ownerIcon' ], false);

const Lodash = window._;

const StatusIcon = React.memo(props => {
  const tooltipText = Messages.BSI_STREAMING_AS_STATUS?.format?.({ status: humanizeStatus?.(props.status) });

  return <Tooltip
    text={tooltipText}
    hideOnClick={false}
  >
    {(tooltipProps) => <div className='bsi-statusIcon' {...tooltipProps}>
      <Activity
        color={props.statusColor}
        className={classes?.icon}
        data-bsi-status={props.status}
        {...tooltipProps}
      />
    </div>}
  </Tooltip>;
});

module.exports = React.memo(props => {
  const { getSetting } = props;

  const locationKey = Lodash.upperFirst(Lodash.camelCase(props.location));

  const settings = {
    showOnBots: getSetting('streamShowOnBots', true),
    showOnSelf: getSetting('streamShowOnSelf', false),
    matchStatus: getSetting('streamMatchStatus', true),
    shouldRender: getSetting(`stream${locationKey}`, true)
  };

  if (!props.user || (props.user.bot && !settings.showOnBots) || (props.user.id === getCurrentUserId?.() && !settings.showOnSelf)) {
    return null;
  }

  const [ status, statusColor, isStreaming ] = Flux.useStateFromStoresArray([ StatusStore ], () => {
    const status = props.status ?? StatusStore?.getStatus?.(props.user.id);
    const activities = props.activities ?? StatusStore?.getActivities?.(props.user.id);

    return [
      status,
      settings.matchStatus ? StatusUtils?.getStatusColor(status) : 'currentColor',
      ActivityStore?.isStreaming?.(activities)
    ];
  });

  return isStreaming && settings.shouldRender ? <StatusIcon status={status} statusColor={statusColor} {...props} /> : null;
});
