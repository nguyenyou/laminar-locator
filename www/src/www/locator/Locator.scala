package www.locator

import scala.scalajs.LinkingInfo.developmentMode

import com.raquo.laminar.api.L.*
import com.raquo.laminar.codecs.StringAsIsCodec

trait Locator(using
    n: sourcecode.Name,
    f: sourcecode.File
) {
  private lazy val scalaSourcePath =
    htmlProp("__scalasourcepath", StringAsIsCodec)
  private lazy val scalaName =
    htmlProp("__scalaname", StringAsIsCodec)

  def render(): HtmlElement

  def apply(): HtmlElement = {
    val el = render()
    el.amend(scalaName := n.value)
    if (developmentMode) {
      el.amend(scalaSourcePath := f.value)
    }
    el

  }

}
