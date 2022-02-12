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

const { React } = require('powercord/webpack');

const Lodash = window._;

module.exports = React.memo(
  (props) => <svg
    {...Lodash.omit(props, [ 'width', 'height', 'color', 'foreground' ])}
    className={props.className ?? null}
    aria-hidden={props['aria-hidden'] ?? false}
    width={props.width ?? 14}
    height={props.height ?? 14}
    viewBox='0 0 14 14'
  >
    <path
      className={props.foreground}
      fill={props.color ?? 'currentColor'}
      d='M6.99471698,9.67522659 C8.47108874,9.67522659 9.66792453,8.47748685 9.66792453,7 C9.66792453,5.52251315 8.47108874,4.32477341 6.99471698,4.32477341 C5.51834522,4.32477341 4.32150943,5.52251315 4.32150943,7 C4.32150943,8.47748685 5.51834522,9.67522659 6.99471698,9.67522659 Z M6.99471698,2.67522659 C8.18867925,2.67522659 9.26641509,3.16163142 10.0483019,3.94410876 L11.9396226,2.05135952 C10.6822642,0.782477341 8.92830189,0 6.99471698,0 C3.12754717,0 0,3.14048338 0,7 L2.67320755,7 C2.67320755,4.6102719 4.60679245,2.67522659 6.99471698,2.67522659 Z M11.3267925,7 C11.3267925,9.3897281 9.39320755,11.3247734 7.00528302,11.3247734 C5.81132075,11.3247734 4.73358491,10.8383686 3.94113208,10.0558912 L2.04981132,11.9486405 C3.31773585,13.2175227 5.06113208,14 6.99471698,14 C10.8618868,14 14,10.8595166 14,7 L11.3267925,7 Z'
    />
  </svg>
);
