/**
 *    Copyright 2016-2020 PeopleWare n.v.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * A TXT record, called `meta.${var.domain_name}`, that has given ${var.additional_meta} as payload. This follows
 * https://tools.ietf.org/html/rfc1464.
 *
 * See HowtoDefineMultiStringTXTRecords.md
 */
resource "aws_route53_record" "meta" {
  zone_id = aws_route53_zone.zone.zone_id
  name    = "meta.${replace(aws_route53_zone.zone.name, "/\\.$/", "")}"
  type    = "TXT"
  ttl     = var.ttl
  records = [
    join("\"\"", formatlist("%s=%s", keys(var.additional_meta), values(var.additional_meta)))
  ]
}
