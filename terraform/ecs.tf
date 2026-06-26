# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "bluegreen-cluster"

  tags = {
    Name = "bluegreen-cluster"
  }
}

# IAM Role for ECS Task Execution
resource "aws_iam_role" "ecs_execution" {
  name = "bluegreen-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ECS Task Definition — Blue
resource "aws_ecs_task_definition" "blue" {
  family                   = "bluegreen-blue"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_execution.arn

  container_definitions = jsonencode([{
    name  = "bluegreen-app"
    image = "${var.aws_account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/${var.ecr_repo}:latest"
    portMappings = [{
      containerPort = var.app_port
      protocol      = "tcp"
    }]
    environment = [
      { name = "APP_VERSION", value = "v1.0.0" },
      { name = "APP_COLOR",   value = "blue" }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = "/ecs/bluegreen-blue"
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "ecs"
      }
    }
  }])
}

# ECS Task Definition — Green
resource "aws_ecs_task_definition" "green" {
  family                   = "bluegreen-green"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_execution.arn

  container_definitions = jsonencode([{
    name  = "bluegreen-app"
    image = "${var.aws_account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/${var.ecr_repo}:latest"
    portMappings = [{
      containerPort = var.app_port
      protocol      = "tcp"
    }]
    environment = [
      { name = "APP_VERSION", value = "v2.0.0" },
      { name = "APP_COLOR",   value = "green" }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = "/ecs/bluegreen-green"
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "ecs"
      }
    }
  }])
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "blue" {
  name              = "/ecs/bluegreen-blue"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "green" {
  name              = "/ecs/bluegreen-green"
  retention_in_days = 7
}

# ECS Service — Blue
resource "aws_ecs_service" "blue" {
  name            = "bluegreen-blue"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.blue.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.public_a.id, aws_subnet.public_b.id]
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.blue.arn
    container_name   = "bluegreen-app"
    container_port   = var.app_port
  }

  depends_on = [aws_lb_listener.main]
}

# ECS Service — Green
resource "aws_ecs_service" "green" {
  name            = "bluegreen-green"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.green.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.public_a.id, aws_subnet.public_b.id]
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.green.arn
    container_name   = "bluegreen-app"
    container_port   = var.app_port
  }

  depends_on = [aws_lb_listener.main]
}