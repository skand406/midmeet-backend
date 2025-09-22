import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { CheckIdDto } from './dto/check-id.dto';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { FindIdDto } from './dto/find-id.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  
  @Get('check-id')
  @ApiQuery({ 
    name: 'id', 
    type: 'string',
    description: '확인할 사용자 ID',
    example: 'test_id123'
  })
  async checkId(@Query() q: CheckIdDto) {
    return this.userService.isCheckIdAvailable(q.id);
  }

  @Get('find-id')
  @ApiQuery({ 
    name: 'email', 
    type: 'string',
    description: '알고 싶은 id의 사용자 이메일',
    example: 'test_id123@example.com'
  })
  async findId(@Query() q: FindIdDto) {
    return this.userService.findId(q.email);
  }
  // @Post()
  // create(@Body() createUserDto: CreateUserDto) {
  //   return this.userService.create(createUserDto);
  // }

  // @Get()
  // findAll() {
  //   return this.userService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.userService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  //   return this.userService.update(+id, updateUserDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.userService.remove(+id);
  // }
}
