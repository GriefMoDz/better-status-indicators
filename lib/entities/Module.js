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

const Injector = require('powercord/injector');
const Utils = require('../utils');

class Module {
  constructor (main) {
    this.cache = {};
    this.main = main;

    const logger = Utils.createLogger(`Module:${this.constructor.name}`);

    for (const logFn of [ 'log', 'debug', 'warn', 'error' ]) {
      this[logFn] = logger[logFn];
    }
  }

  async _load () {
    try {
      const t0 = performance.now();

      await this.startModule?.();

      const t1 = performance.now();

      this.log(`Module loaded${this.startModule ? `. Initialization took ${Math.floor(t1 - t0)}ms` : ''}`);
    } catch (e) {
      this.error('An error has occurred while trying to initialize this module.', e);
    }
  }

  async _unload () {
    try {
      for (const injectionID of (this.cache.injections || [])) {
        Injector.uninject(injectionID);
      }

      await this.moduleWillUnload?.();

      this.log('Module unloaded');
    } catch (e) {
      this.error('An error has occurred while trying to shut down this module.', e);
    }
  }

  inject (injectionID, ...args) {
    (this.cache.injections ??= []).push(injectionID);

    Injector.inject(injectionID, ...args);
  }
};

module.exports = Module;
