/**
 *    Copyright 2017 - 2025 PeopleWare n.v.
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

resource "aws_s3_bucket" "terraform_state_logging" {
  bucket = var.prefix == "" ? format("tfstate-log.%s", var.organisation_name) : format("%s.tfstate-log.%s", var.prefix, var.organisation_name)

  tags = var.tags

  lifecycle {
    prevent_destroy = true
  }

  /* We considered setting up object lifecycle management to automatically move
     older logs to STANDARD_IA (infrequent access) or GLACIER storage class
     (e.g., after one year). This does not make sense, however, because the separate
     log files are very small. See
     [https://docs.aws.amazon.com/AmazonS3/latest/dev/lifecycle-transition-general-considerations.html],
     Storage overhead charges.

     We choose to never delete (expire) logs. The benefits of a full audit log
     outweigh the storage cost.
   */

  // TODO small file hypothesis needs to be validated
}

resource "aws_s3_bucket_versioning" "terraform_state_logging" {
  bucket = aws_s3_bucket.terraform_state_logging.id

  versioning_configuration {
    status = "Suspended"
  }
}

resource "aws_s3_bucket_acl" "terraform_state_logging" {
  bucket = aws_s3_bucket.terraform_state_logging.id
  acl    = "log-delivery-write"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state_logging" {
  bucket = aws_s3_bucket.terraform_state_logging.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

data "aws_iam_policy_document" "prohibit-delete" {
  statement {
    effect = "Deny"

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    actions   = module.actions.I-s3-bucket-objects-delete_changeconfig
    resources = ["${aws_s3_bucket.terraform_state_logging.arn}/*"]
  }
}

resource "aws_s3_bucket_policy" "prohibit-delete" {
  bucket = aws_s3_bucket.terraform_state_logging.id

  policy = data.aws_iam_policy_document.prohibit-delete.json
}
