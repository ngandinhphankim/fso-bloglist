const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')
const helper = require('../utils/list_helper')

const api = supertest(app)

beforeEach(async () => {
    await Blog.deleteMany({})
    await Blog.insertMany(helper.initialBlogs)
})

describe('GET /blogs', () => {
    test('response with json and correct amount', async () => {
        const response = await api
            .get('/api/blogs')
            .expect(200)
            .expect('Content-Type', /application\/json/)

        expect(response.body).toHaveLength(helper.initialBlogs.length)
    })

    test('the unique idetifier property of the blog posts is named id', async () => {
        const response = await api.get('/api/blogs')
        expect(response.body[0].id).toBeDefined()
    })
}, 7000)

describe('POST /blogs', () => {
    test('successfully creates a new blog', async () => {
        const newBlog = {
            title: "Type wars",
            author: "Robert C. Martin",
            url: "http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html",
            likes: 2,
        }

        const response = await api
            .post('/api/blogs')
            .send(newBlog)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)
        expect(blogsAtEnd.map(blog => blog.title)).toContain(newBlog.title)
    })

    test('auto set the default value 0 when the likes property is missing', async () => {
        const newBlog = {
            title: "Type wars",
            author: "Robert C. Martin",
            url: "http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html",
        }

        const response = await api
            .post('/api/blogs')
            .send(newBlog)
            .expect(201)
            .expect('Content-Type', /application\/json/)
        expect(response.body.likes).toBe(0)
    })

    test('reqponse 400 when the title and url properties are missing', async () => {
        const newBlog = {
            author: "Robert C. Martin",
        }

        const response = await api
            .post('/api/blogs')
            .send(newBlog)
            .expect(400)
    })
}, 7000)

describe('DELETE /blogs/:id', () => {
    test('sucessfully delete with status 204 if id was valid', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blogToDelete = blogsAtStart[0]

        const response = await api
            .delete(`/api/blogs/${blogToDelete.id}`)
            .expect(204)

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd.map(blog => blog.title)).not.toContain(blogToDelete.title)
    })
}, 7000)

describe('PUT /blogs/:id', () => {
    test('sucessfully update', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blogToUpdate = blogsAtStart[0]

        const response = await api
            .put(`/api/blogs/${blogToUpdate.id}`)
            .send({likes: blogToUpdate.likes + 1})
            .expect('Content-Type', /application\/json/)

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd[0].likes).toBe(blogToUpdate.likes + 1)
    })
}, 7000)

afterAll(() => {
    mongoose.connection.close()
})
