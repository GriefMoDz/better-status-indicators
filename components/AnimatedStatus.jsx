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

const ReactHooks = {
  Spring: getModule([ 'useSpring' ], false),
  Basic: getModule([ 'useLazyValue' ], false)
};

const uuid = getModule([ 'v4', 'parse' ], false);
const classes = getModule([ 'wrapper', 'avatar' ], false);
const config = { tension: 600, friction: 70 };

const StatusModule = getModule([ 'getStatusMask' ], false);

const AnimatedStatus = React.memo(props => {
  if (!ReactHooks.Spring || !ReactHooks.Basic) {
    return null;
  }

  const { status, className, style } = props;
  const { Spring: { animated, useSpring }, Basic } = ReactHooks;

  const isMobile = props.isMobile ?? false;
  const color = props.color ?? StatusModule?.getStatusColor?.(status);
  const size = props.size ?? 8;

  const statusValues = React.useMemo(() => StatusModule?.getStatusValues?.({ size, status, isMobile }), [ size, status, isMobile ]);
  const statusDimensions = useSpring({ config, to: statusValues });
  const statusHeight = Math.ceil(size * 1.5);
  const statusColor = useSpring(
    { config, fill: color },
    [ color ]
  )[0].fill;

  const maskID = Basic.useLazyValue(() => uuid?.v4?.());
  const statusMask = StatusModule?.renderStatusMask?.(statusDimensions, size, maskID);

  if (props.getSetting('statusDisplay', 'default') === 'solid' && !isMobile) {
    delete statusMask.props.children[1];
  }

  return (
    <svg
      width={size}
      height={statusHeight}
      viewBox={`0 0 ${size} ${statusHeight}`}
      className={[ classes?.mask, className ].filter(Boolean).join(' ')}
      data-bsi-status={status}
      style={style}
    >
      {statusMask}
      <animated.rect x={0} y={0} width={size} height={statusHeight} fill={statusColor} mask={`url(#${maskID})`} />
    </svg>
  );
});

module.exports = Flux.connectStores([ powercord.api.settings.store ], () => ({
  ...powercord.api.settings._fluxProps('better-status-indicators')
}))(AnimatedStatus);
