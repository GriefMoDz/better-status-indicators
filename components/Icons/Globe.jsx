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
    width={props.width ?? 24}
    height={props.height ?? 24}
    viewBox='0 0 24 24'
  >
    <path
      className={props.foreground}
      fill={props.color ?? 'currentColor'}
      fill-rule='evenodd'
      d='M16.4770909,19 C18.0152727,16.936 18.9381818,14.531 19.1323636,12 L21.7527273,12 C21.3829091,15.056 19.3363636,17.65 16.4770909,19 Z M2.24618182,12 L4.86654545,12 C5.06072727,14.531 5.98363636,16.936 7.52181818,19 C4.66254545,17.65 2.616,15.056 2.24618182,12 Z M7.52181818,3 C5.98254545,5.064 5.06072727,7.469 4.86654545,10 L2.24618182,10 C2.616,6.944 4.66254545,4.35 7.52181818,3 Z M13.0909091,10 L13.0909091,2.369 C15.3294545,4.416 16.6930909,7.111 16.9505455,10 L13.0909091,10 Z M13.0909091,19.631 L13.0909091,12 L16.9505455,12 C16.6930909,14.889 15.3294545,17.584 13.0909091,19.631 Z M10.9090909,12 L10.9090909,19.631 C8.66945455,17.584 7.30581818,14.889 7.04836364,12 L10.9090909,12 Z M10.9090909,10 L7.04836364,10 C7.30581818,7.111 8.66945455,4.416 10.9090909,2.369 L10.9090909,10 Z M19.1323636,10 C18.9381818,7.469 18.0163636,5.064 16.4770909,3 C19.3363636,4.35 21.3829091,6.944 21.7527273,10 L19.1323636,10 Z M0,11 C0,17.075 5.37163636,22 12,22 C18.6272727,22 24,17.075 24,11 C24,4.925 18.6272727,0 12,0 C5.37163636,0 0,4.925 0,11 Z'
      transform='translate(0 1)'
    />
  </svg>
);
