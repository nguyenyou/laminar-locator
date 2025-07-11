package www

import www.components.Button
import www.locator.Locator

import com.raquo.laminar.api.L.*

case class App() extends Locator {
  def render() = {
    div(
      width.px(300),
      height.px(300),
      border("1px solid black"),
      display.flex,
      padding.px(12),
      alignItems.start,
      Button()()
    )
  }
}
