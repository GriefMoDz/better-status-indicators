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

const { React, getModule, getModuleByDisplayName } = require('powercord/webpack');
const { wrapInHooks } = require('powercord/util');

const ClientStatuses = require('./../components/ClientStatuses');
const AnimatedStatus = require('./../components/AnimatedStatus');
const StatusIcon = require('./../components/StatusIcon');

module.exports = (main) => {
  const { getSetting } = main._settings;

  const Mask = getModule([ 'MaskLibrary' ], false);
  const StatusModule = getModule([ 'getStatusMask' ], false);

  main.inject('bsi-status-icon', StatusModule, 'Status', ([ { isMobile, status, size, color } ], res) => {
    const statusStyles = res.props?.children?.props?.style;
    if (!color && statusStyles) {
      statusStyles.backgroundColor = getSetting(`${status}StatusColor`, main.defaultStatusColors[status.toUpperCase()]);
    }

    if (status !== 'online' && isMobile) {
      res.props = { ...res.props,
        mask: Mask.MaskIDs.STATUS_ONLINE_MOBILE,
        height: size * 1.5,
        width: size
      };
    }

    return res;
  });

  const ConnectedClientStatuses = powercord.api.settings.connectStores('better-status-indicators')(ClientStatuses);
  const ConnectedStatusIcon = powercord.api.settings.connectStores('better-status-indicators')(StatusIcon);

  const Status = getModuleByDisplayName('FluxContainer(Status)', false);

  main.inject('bsi-mobile-custom-status-pre', Status.prototype, 'render', function (args) {
    if (!getSetting('mobileAvatarStatus', true)) {
      this.props.isMobile = false;
    }

    return args;
  }, true)

  const dividerClass = getModule([ 'transparent', 'divider' ], false)?.divider;
  const UserStore = getModule([ 'initialize', 'getCurrentUser' ], false);

  main.inject('bsi-custom-status-icon', Status.prototype, 'render', function (_, res) {
    const StatusComponent = main.hardwareAccelerationIsEnabled ? AnimatedStatus : StatusModule.Status;
    const originalProps = res.props;

    res = res.type(originalProps);

    const tooltipChildren = res.props.children(originalProps);
    tooltipChildren.props.children.type = StatusComponent;

    const customProps = {
      user: UserStore.getUser(this.props.userId),
      location: 'direct-messages',
      tooltipPosition: 'bottom'
    };

    const hasStatusIcon =  wrapInHooks(() => (<StatusIcon {...customProps} />).type.type({ ...customProps, ...main._settings }))();
    const hasClientStatuses = wrapInHooks(() => (<ClientStatuses {...customProps } />).type.type({ ...customProps, ...main._settings }))();

    if (originalProps.status !== 'offline' && (hasStatusIcon || hasClientStatuses)) {
      if(!Array.isArray(res)) {
        res = [ res ];
      }

      res.push(...[
        <div className={dividerClass} />,
        <ConnectedStatusIcon {...customProps} />,
        <ConnectedClientStatuses {...customProps} />
      ]);
    }

    return res;
  });
};
