import { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import routeV1 from './v1/index.js';
import { STATUS } from './v1/common/constants/status.js';

export default async function app(fastify: FastifyInstance) {
  setErrorHandler(fastify);
  setDecorate(fastify);
  setMiddleware(fastify);

  fastify.register(routeV1, { prefix: '/v1' });
}

function setErrorHandler(fastify: FastifyInstance) {
  fastify.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    fastify.log.error(error);
    const statusCode: number = error.statusCode || 500;
    reply.code(statusCode).send({
      status: STATUS.ERROR,
      message: error.message,
    });
  });
}

function setMiddleware(fastify: FastifyInstance) {
  fastify.addHook('onRequest', (request, reply, done) => {
    console.log(request.headers);
    const authorized = request.headers['x-authorized'];
    if (authorized === undefined || Array.isArray(authorized)) {
      done();
    }

    if (authorized === 'true') {
      request.authorized = true;
      request.myId = Number(request.headers['x-user-id']);
    }
    done();
  });
}

function setDecorate(fastify: FastifyInstance) {
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    console.log(request.authorized);
    if (!request.authorized) {
      reply.code(401).send({
        status: STATUS.ERROR,
        message: 'Unauthorized',
      });
    }
  });
}
