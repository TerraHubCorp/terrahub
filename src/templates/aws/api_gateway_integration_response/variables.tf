# Define list of variables to be used in main.tf

############
# provider #
############
variable "account_id" {
  description = "Allowed AWS account ID, to prevent you from mistakenly using an incorrect one (and potentially end up destroying a live environment)."
}

variable "region" {
  description = "This is the AWS region."
}

#############
# top level #
#############
variable "aws_api_gateway_rest_api_id" {
  description = "The ID of the associated REST API."
}

variable "aws_api_gateway_resource_id" {
  description = "The API resource ID."
}

variable "aws_api_gateway_method_http_method" {
  description = "he HTTP method (GET, POST, PUT, DELETE, HEAD, OPTION, ANY) when calling the associated resource."
}

variable "aws_api_gateway_status_code" {
  description = "The HTTP status code."
}
