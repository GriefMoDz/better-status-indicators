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

const { LogColors } = require('./constants');

module.exports = Object.freeze({
  joinClassNames: (...args) => args.filter(Boolean).join(' '),
  createLogger: (displayName) => {
    const moduleName = displayName.split(':').pop();

    const writeLog = (type, ...message) => {
      const logColor = LogColors[type];
      const styles = `
        font-family: Helvetica;
        font-weight: 600;
        font-size: 11px;
        background-color: ${logColor}2f;
        border: 1px solid ${logColor}5f;
        border-radius: 8px;
        padding: 2px 5px;
      `;

      displayName = displayName.replace(`:${moduleName}`, '');

      const logFn = console[type] ?? console.log;

      if (displayName === moduleName) {
        logFn(`%cBetterStatusIndicators:${displayName}`, styles, ...message);
      } else {
        logFn(`%cBetterStatusIndicators:${displayName} %c${moduleName}`, `${styles} margin-right: 5px;`, styles, ...message);
      }
    };

    return {
      log: (...message) => writeLog('log', ...message),
      debug: (...message) => writeLog('debug', ...message),
      warn: (...message) => writeLog('warn', ...message),
      error: (...message) => writeLog('error', ...message)
    };
  },
  getDefaultMethodByKeyword: (mdl, keyword) => {
    const defaultMethod = mdl.__powercordOriginal_default ?? mdl.default;
    return typeof defaultMethod === 'function' ? defaultMethod.toString().includes(keyword) : null;
  }
});
