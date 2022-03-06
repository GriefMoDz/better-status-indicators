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

module.exports = {
  Desktop: () => (
    <mask id='svg-mask-status-online-desktop' maskContentUnits='objectBoundingBox' viewBox='0 0 1 1'>
      <rect fill='white' x='0' y='0.025' width='1' height='0.75' rx='0.1' ry='0.1' />
      <rect fill='black' x='0.1' y='0.125' width='0.8' height='0.45' />
      <rect fill='white' x='0.450' y='0.772' width='0.1' height='0.105' />
      <rect fill='white' x='0.250' y='0.875' width='0.5' height='0.1' />
    </mask>
  ),
  Web: () => (
    <mask id='svg-mask-status-online-web' maskContentUnits='objectBoundingBox' viewBox='0 0 1 1'>
      <path fill='white' d='M.5 0a.5.5 0 100 1 .5.5 0 000-1zM.1.5L.11.41l.24.24V.7c0 .05.05.1.1.1v.1A.4.4 0 01.1.5zm.7.27C.72.84.73.7.7.7H.65V.55A.05.05 0 00.6.5H.3V.4h.1C.43.4.45.38.45.35v-.1h.1a.1.1 0 00.1-.1V.13a.4.4 0 01.14.64' />
    </mask>
  )
};
