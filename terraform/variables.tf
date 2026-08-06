# Inputs to the configuration. Defaults are set here; override per-machine
# in terraform.tfvars (which is gitignored).

variable "aws_region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "us-east-1"
}

variable "aws_account_id" {
  description = "AWS Account ID — set in terraform.tfvars, never hardcoded here."
  type        = string
}

variable "app_name" {
  description = "Name prefix applied to all resources."
  type        = string
  default     = "bluegreen-app"
}

variable "ecr_repo" {
  description = "ECR repository name for Docker images."
  type        = string
  default     = "bluegreen-app"
}

variable "app_port" {
  description = "Port the Node.js app listens on inside the container."
  type        = number
  default     = 3000
}