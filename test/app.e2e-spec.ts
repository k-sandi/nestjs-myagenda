import { Test } from '@nestjs/testing'
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import * as pactum from 'pactum'
import { AuthDto } from '../src/auth/dto';
import { EditUserDto } from 'src/user/dto';
import { CreateBookmarkDto, EditBookmarkDto } from 'src/bookmark/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true
      })
    )
    await app.init();
    await app.listen(3334);

    prisma = app.get(PrismaService)

    await prisma.cleanDb()

    pactum.request.setBaseUrl('http://localhost:3334')
  })

  afterAll(() => {
    app.close();
  })

  // it.todo('should pass')
  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'test004@example.com',
      password: 'secret'
    }

    describe('Signup', () => {
      it('should throw if email empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            password: dto.password
          })
          .expectStatus(400)
      })

      it('should throw if password empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            email: dto.email
          })
          .expectStatus(400)
      })

      it('should throw if invalid email formated', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            email: 'test004email.com',
            password: dto.password
          })
          .expectStatus(400)
      })

      it('should throw if no body provided', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .expectStatus(400)
      })

      it('should signup', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(200)
        // .inspect()
      })
    });

    describe('Signin', () => {
      it('should throw if email empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            password: dto.password
          })
          .expectStatus(400)
      })

      it('should throw if password empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            email: dto.email
          })
          .expectStatus(400)
      })

      it('should throw if invalid email formatted', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            email: 'test004example.com',
            password: dto.password
          })
          .expectStatus(400)
      })

      it('should throw if no body provided', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .expectStatus(400)
      })

      it('should signin', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('uat', 'access_token')
      })
    });
  });

  describe('User', () => {
    describe('Get me', () => {
      it('should get current user but no token provided/unauthorized', () => {
        return pactum
          .spec()
          .get('/user/me')
          .expectStatus(401)
      })

      it('should get current user with incorrect token', () => {
        let sample_invalid_token = 'ehbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidGVzdDAwMUBleGFtcGxlLmNvbSIsImlhdCI6MTcwODc5MzE2NiwiZXhwIjoxNzA4ODc5NTY2fQ.c2JiuMu8lHILEPI6ljZjZMlpkEdYmYHZ8RVkgJCgnL8';
        return pactum
          .spec()
          .get('/user/me')
          .withHeaders({
            Authorization: 'Bearer ' + sample_invalid_token
          })
          .expectStatus(401)
      })

      it('should get current user', () => {
        return pactum
          .spec()
          .get('/user/me')
          .withHeaders({
            Authorization: 'Bearer $S{uat}'
          })
          .expectStatus(200)
      })
    })

    describe('Edit user', () => {
      const dto: EditUserDto = {
        firstName: "test004",
        email: "test004@gmail.com"
      }
      it('should edit user', () => {
        return pactum
          .spec()
          .patch('/user')
          .withHeaders({
            Authorization: 'Bearer $S{uat}',
          })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.firstName)
          .expectBodyContains(dto.email)
      });
    })
  });

  describe('Bookmark', () => {
    describe('Get empty bookmark', () => {
      it("should get bookmarks", () => {
        return pactum
          .spec()
          .get('/bookmark')
          .withHeaders({
            Authorization: 'Bearer $S{uat}',
          })
          .expectStatus(200)
          .expectBody([])
      })
    })

    describe('Create bookmark', () => {
      const dto: CreateBookmarkDto = {
        title: 'First Bookmark',
        link: 'https://www.yotube.com'
      }
      it("should create bookmark", () => {
        return pactum
          .spec()
          .post('/bookmark')
          .withHeaders({
            Authorization: 'Bearer $S{uat}',
          })
          .withBody(dto)
          .expectStatus(201)
          .stores('bookmarkId', 'id')
      })
    })

    describe('List bookmark', () => {
      it("should get list bookmark", () => {
        return pactum
          .spec()
          .get('/bookmark')
          .withHeaders({
            Authorization: 'Bearer $S{uat}',
          })
          .expectStatus(200)
          .expectJsonLength(1)
      })
    })

    describe('Get bookmark by id', () => {
      it("should get bookmark by id", () => {
        return pactum
          .spec()
          .get('/bookmark/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{uat}',
          })
          .expectStatus(200)
          .expectBodyContains('$S{bookmarkId}')
      })
    })

    describe('Edit bookmark by id', () => {
      const dto: EditBookmarkDto = {
        title: 'Kubernetes Course Tutorial',
        description: 'Learn how to use kubernetes in this completed course.'
      }

      it('should edit bookmark', ()=> {
        return pactum
          .spec()
          .patch('/bookmark/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withBody(dto)
          .withHeaders({
            Authorization: 'Bearer $S{uat}'
          })
          .expectStatus(200)
          .expectBodyContains(dto.title)
          .expectBodyContains(dto.description)
      })
    })

    describe('Delete bookmark by id', () => {
      it('should delete bookmark', ()=>{
        return pactum
          .spec()
          .patch('/bookmark/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{uat}'
          })
          .expectStatus(200)
      })

      it("should get empty bookmark", () => {
        return pactum
          .spec()
          .get('/bookmark')
          .withHeaders({
            Authorization: 'Bearer $S{uat}',
          })
          .expectStatus(200)
          .expectJsonLength(0)
      })
    })
  });
})