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

/* eslint-disable multiline-ternary */
const { React, getModule } = require('powercord/webpack');

const avatarModule = getModule([ 'AnimatedAvatar' ], false);

module.exports = React.memo(props => {
  const { status, isMobile, isTyping, statusColor } = props;

  const statusRef = React.useRef(props.fromStatus);
  const isMobileRef = React.useRef(props.fromIsMobile);
  const statusColorRef = React.useRef(props.fromColor);
  const animatedRef = React.useRef(!1);
  const animated = animatedRef.current || avatarModule.determineIsAnimated(isTyping, status, statusRef.current, isMobile, isMobileRef.current);

  return (React.useLayoutEffect((() => {
    animatedRef.current = animated;
    statusRef.current = status;
    isMobileRef.current = isMobile;
    statusColorRef.current = statusColor;
  }), [ status, isMobile, statusColor, animated ]),
  status !== null && statusRef.current !== null && animated ? React.createElement(props.component, props) : React.createElement(avatarModule.default, props));
});
