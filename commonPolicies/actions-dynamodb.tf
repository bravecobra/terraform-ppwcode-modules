#    Copyright 2020 PeopleWare n.v.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# See https://docs.aws.amazon.com/IAM/latest/UserGuide/list_dynamodb.html and
# https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/api-permissions-reference.html for all DynamoDB
# actions.

locals {
  # resource: *
  actions-dynamodb-tables-describe = [
    "dynamodb:DescribeLimits",
    "dynamodb:DescribeReservedCapacity",
    "dynamodb:DescribeReservedCapacityOfferings",
    "dynamodb:ListTables",
    "dynamodb:ListBackups",
    "dynamodb:DescribeTimeToLive",
    "dynamodb:ListStreams",
    "dynamodb:ListTagsOfResource",
  ]
  # resource: <table_arn>
  actions-dynamodb-table-define = [
    "dynamodb:CreateTable",
    "dynamodb:DeleteTable",
    "dynamodb:UpdateTable",
    "dynamodb:CreateBackup",
    "dynamodb:DeleteBackup",
    "dynamodb:RestoreTableFromBackup",
  ]
  # resource: <table_arn>
  actions-dynamodb-items-readwrite = [
    "dynamodb:BatchGetItem",
    "dynamodb:BatchWriteItem",
    "dynamodb:DeleteItem",
    "dynamodb:DescribeTable",
    "dynamodb:GetItem",
    "dynamodb:PutItem",
    "dynamodb:Query",
    "dynamodb:Scan",
    "dynamodb:UpdateItem",
    "dynamodb:DescribeBackup",
    "dynamodb:DescribeContinuousBackups",
  ]
  # resource: index (<table_arn>/index/*)
  actions-dynamodb-index-read = [
    "dynamodb:Query",
    "dynamodb:Scan",
  ]
  # resource: stream (<table_arn>/stream/*)
  actions-dynamodb-stream-read = [
    "dynamodb:DescribeStream",
    "dynamodb:GetRecords",
    "dynamodb:GetShardIterator",
  ]

  # NOTE: cannot deny, because it is global
  #       - "dynamodb:PurchaseReservedCapacityOfferings"
  #       - "dynamodb:TagResource"
  #       - "dynamodb:UntagResource"


  # NOTE: documented, but not recognized by AWS:
  #       - "dynamodb:UpdateTimeToLive"
}
