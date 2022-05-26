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

const { React, getModule } = require('powercord/webpack');

const AvatarModule = getModule([ 'AnimatedAvatar' ], false);

module.exports = React.memo(props => {
  const { status, isMobile, isTyping, statusColor } = props;

  const refs = {
    status: React.useRef(props.fromStatus),
    isMobile: React.useRef(props.fromIsMobile),
    statusColor: React.useRef(props.fromColor),
    animated: React.useRef(false)
  };

  const animated = refs.animated.current || AvatarModule?.determineIsAnimated?.(isTyping, status, refs.status.current, isMobile, refs.isMobile.current);

  React.useLayoutEffect(() => {
    refs.animated.current = animated;
    refs.status.current = status;
    refs.isMobile.current = isMobile;
    refs.statusColor.current = statusColor;
  }, [ status, isMobile, statusColor, animated ]);

  const Avatar = animated ? props.component : AvatarModule.default;

  if (!status && !refs.status.current) {
    return null;
  }

  return <Avatar {...props} />;
});
