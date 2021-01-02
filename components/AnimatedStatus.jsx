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
const { React, getModule } = require('powercord/webpack');
const ReactHooks = {};

ReactHooks.Spring = getModule([ 'useSpring' ], false);
ReactHooks.Basic = getModule([ 'useLazyValue' ], false);

const uuid = getModule([ 'v4', 'parse' ], false);
const classes = getModule([ 'wrapper', 'avatar' ], false);
const statusModule = getModule([ 'getStatusMask' ], false);

module.exports = React.memo(props => {
  const { status, color, className, style } = props;

  const isMobile = props.isMobile !== void 0 && props.isMobile;
  const size = props.size !== void 0 ? props.size : 8;
  const config = { tension: 600, friction: 70 };

  const maskId = ReactHooks.Basic.useLazyValue((() => uuid.v4()));

  const statusValues = React.useMemo((() => statusModule.getStatusValues({ size, status, isMobile })), [ size, status, isMobile ]);
  const statusDimensions = ReactHooks.Spring.useSpring({ config, to: statusValues });
  const statusColor = ReactHooks.Spring.useSpring(
    { config, fill: !color ? statusModule.getStatusColor(status) : color },
    [ !color ? statusModule.getStatusColor(status) : color ]
  )[0].fill;

  return React.createElement('svg', {
    width: size,
    height: Math.ceil(size * 1.5),
    viewBox: `0 0 ${size} ${Math.ceil(size * 1.5)}`,
    className: [ classes.mask, className ].filter(Boolean).join(' '),
    style
  }, void 0, statusModule.renderStatusMask(statusDimensions, size, maskId), React.createElement(ReactHooks.Spring.animated.rect, {
    x: 0,
    y: 0,
    width: size,
    height: Math.ceil(size * 1.5),
    fill: statusColor,
    mask: `url(#${maskId})`
  }));
});
