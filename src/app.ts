import { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import routeV1 from './v1/index.js';
import { STATUS } from './v1/common/constants/status.js';
import { UnAuthorizedException } from './v1/common/exceptions/core.error.js';

export default async function app(fastify: FastifyInstance) {
  setErrorHandler(fastify);
  setDecorate(fastify);
  setMiddleware(fastify);

  fastify.register(routeV1, { prefix: '/users/v1' });
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
    const authenticated = request.headers['x-authenticated'];
    const userId = request.headers['x-user-id'];
    
    if (authenticated === undefined || Array.isArray(authenticated)) {
      done();
    }
    if (userId === undefined || Array.isArray(userId)) {
      done();
    }
    if (isNaN(Number(userId))) {
      throw new UnAuthorizedException('user id is not a number');
    }

    if (authenticated === 'true') {
      request.authenticated = true;
      request.userId = parseInt(userId as string , 10);
    }
    done();
  });
}

function setDecorate(fastify: FastifyInstance) {
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    console.log(request.authenticated);
    if (!request.authenticated) {
      reply.code(401).send({
        status: STATUS.ERROR,
        message: 'Unauthorized',
      });
    }
  });
}
