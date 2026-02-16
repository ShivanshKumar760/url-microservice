# This Dockerfile sets up a RabbitMQ server with the management plugin enabled.
FROM rabbitmq:3.13-management

# Set environment variables for default user and password
ENV RABBITMQ_DEFAULT_USER=admin 
ENV RABBITMQ_DEFAULT_PASS=admin

# Expose required ports
# 5672 = AMQP
# 15672 = Management UI
EXPOSE 5672 15672


# Start RabbitMQ server
CMD ["rabbitmq-server"]