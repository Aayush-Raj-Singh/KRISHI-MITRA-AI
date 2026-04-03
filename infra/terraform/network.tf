data "aws_availability_zones" "available" {
  count = var.enable_network ? 1 : 0
  state = "available"
}

resource "aws_vpc" "main" {
  count                = var.enable_network ? 1 : 0
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = local.tags
}

resource "aws_internet_gateway" "igw" {
  count  = var.enable_network ? 1 : 0
  vpc_id = aws_vpc.main[0].id
  tags   = local.tags
}

resource "aws_subnet" "public" {
  count                   = var.enable_network ? length(var.public_subnet_cidrs) : 0
  vpc_id                  = aws_vpc.main[0].id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available[0].names[count.index]
  map_public_ip_on_launch = true
  tags = merge(local.tags, {
    Name = "${var.project_name}-public-${count.index + 1}"
  })
}

resource "aws_subnet" "private" {
  count                   = var.enable_network ? length(var.private_subnet_cidrs) : 0
  vpc_id                  = aws_vpc.main[0].id
  cidr_block              = var.private_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available[0].names[count.index]
  map_public_ip_on_launch = false
  tags = merge(local.tags, {
    Name = "${var.project_name}-private-${count.index + 1}"
  })
}

resource "aws_eip" "nat" {
  count  = var.enable_network && var.enable_nat_gateway ? 1 : 0
  domain = "vpc"
  tags   = local.tags
}

resource "aws_nat_gateway" "nat" {
  count         = var.enable_network && var.enable_nat_gateway ? 1 : 0
  allocation_id = aws_eip.nat[0].id
  subnet_id     = aws_subnet.public[0].id
  tags          = local.tags
  depends_on    = [aws_internet_gateway.igw]
}

resource "aws_route_table" "public" {
  count  = var.enable_network ? 1 : 0
  vpc_id = aws_vpc.main[0].id
  tags = merge(local.tags, {
    Name = "${var.project_name}-public-rt"
  })
}

resource "aws_route" "public_internet" {
  count                  = var.enable_network ? 1 : 0
  route_table_id         = aws_route_table.public[0].id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.igw[0].id
}

resource "aws_route_table_association" "public" {
  count          = var.enable_network ? length(aws_subnet.public) : 0
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public[0].id
}

resource "aws_route_table" "private" {
  count  = var.enable_network ? 1 : 0
  vpc_id = aws_vpc.main[0].id
  tags = merge(local.tags, {
    Name = "${var.project_name}-private-rt"
  })
}

resource "aws_route" "private_nat" {
  count                  = var.enable_network && var.enable_nat_gateway ? 1 : 0
  route_table_id         = aws_route_table.private[0].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat[0].id
}

resource "aws_route_table_association" "private" {
  count          = var.enable_network ? length(aws_subnet.private) : 0
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[0].id
}
