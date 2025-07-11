package www.components

import www.locator.Locator

import com.raquo.laminar.api.L.*

case class Button() extends Locator {
  def render() = {
    button("Click me")
  }
}
