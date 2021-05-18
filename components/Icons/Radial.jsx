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

module.exports = React.memo(
  (props) => {
    const filteredProps = ((props, filter) => {
      if (props) {
        const newProps = { ...props };

        filter.forEach(prop => delete newProps[prop]);

        return newProps;
      }

      return {};
    })(props, [ 'width', 'height', 'color', 'foreground' ]);

    return <svg
      {...filteredProps}
      aria-hidden={props['aria-hidden'] ?? false}
      width={props.width ?? 24}
      height={props.height ?? 24}
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="11" className={props.foreground} fill="none" stroke={props.color ?? 'currentColor'} stroke-width="2" />
    </svg>;
  }
);
