/**
 *    Copyright 2017 PeopleWare n.v.
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

output "I-zone_id" {
  value = var.domain-zone_id
}

locals {
  I_instanceInfo = {
    type     = local.main_type
    instance = aws_route53_record.srv.name
    host     = var.host
    port     = var.port
    priority = var.priority
    weight   = var.weight
  }
}

output "I-instance" {
  value = merge(local.fullDetails, local.I_instanceInfo)
}
