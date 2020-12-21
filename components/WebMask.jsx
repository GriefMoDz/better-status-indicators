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

const { React } = require('powercord/webpack');

module.exports = React.memo(
  () => <mask id='svg-mask-status-online-web' maskContentUnits='objectBoundingBox' viewBox='0 0 1 1'>
    <circle fill='white' cx='0.5' cy='0.5' r='0.5' />
    <circle fill='black' cx='0.5' cy='0.5' r='0.4' />
    <ellipse fill='white' cx='0.5' cy='0.5' rx='0.275' ry='0.5' />
    <ellipse fill='black' cx='0.5' cy='0.5' rx='0.2' ry='0.38' />
    <rect fill='white' x='0.1' y='0.45' width='1' height='0.10' />
    <rect fill='white' x='0.1' y='0.45' width='1' height='0.10' transform='rotate(90 0.5 0.5)' />
  </mask>
);
