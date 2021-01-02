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
const { Flex } = require('powercord/components');

const Button = getModule(m => m.ButtonLink, false).default;

const colorUtils = getModule([ 'isValidHex' ], false);
const classes = getModule([ 'container', 'editIcon' ], false);

module.exports = class TextInputWithButton extends React.PureComponent {
  constructor (props) {
    super(props);

    this.iconStyles = {
      color: 'var(--text-normal)',
      lineHeight: 0,
      backgroundImage: 'none',
      marginTop: 0
    };
  }

  handleChange (e) {
    if (typeof this.props.onChange === 'function') {
      this.props.onChange(e.currentTarget.value);
    }
  }

  render () {
    const { disabled, defaultValue, placeholder, buttonText, buttonColor, buttonIcon, onButtonClick } = this.props;

    return (
      <div className={[ 'bsi-button-text-input', classes.container, classes.hasValue, disabled && classes.disabled ].filter(Boolean).join(' ')}>
        <Flex className={classes.layout}>
          <Flex.Child className={classes.input.split(' ').splice(1).join(' ')} style={{ cursor: 'auto' }}>
            <input type='text' value={defaultValue} placeholder={placeholder} disabled={disabled} onChange={this.handleChange.bind(this)}></input>
          </Flex.Child>

          <Flex shrink={1} grow={0} style={{ margin: 0 }}>
            <Button
              className={classes.button}
              disabled={disabled}
              size={Button.Sizes.MIN}
              color={Button.Colors.GREY}
              look={Button.Looks.GHOST}
              onClick={onButtonClick}
              style={{ backgroundColor: buttonColor ? colorUtils.hex2rgb(buttonColor, 0.25) : null }}
            >
              <span className={classes.text}>{buttonText}</span>
              <span className={`${buttonIcon} ${classes.editIcon}`} style={this.iconStyles}></span>
            </Button>
          </Flex>
        </Flex>
      </div>
    );
  }
};
