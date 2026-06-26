output "alb_dns_name" {
  description = "ALB DNS name — your app URL"
  value       = aws_lb.main.dns_name
}

output "ecr_repo_uri" {
  description = "ECR repository URI"
  value       = "${var.aws_account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/${var.ecr_repo}"
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}